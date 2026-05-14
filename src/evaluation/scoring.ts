// Scoring local (mock). À remplacer par l'Edge Function `score-placement-test`.
//
// TODO: Connect to Edge Function
// Remplacer le bloc `computeResult` ci-dessous par un appel HTTP du type :
//
//   const res = await fetch(
//     "https://jjhnaxuyunpocuuswvyb.supabase.co/functions/v1/score-placement-test",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: "Bearer YOUR_ANON_KEY",
//       },
//       body: JSON.stringify({ candidateName, answers }),
//     },
//   );
//   const data = await res.json(); // { scores, perSkillLevel, globalLevel, flags, narrative, ... }
//
// L'Edge Function renvoie déjà l'analyse pédagogique (avis de l'expert).
import { ITEMS, ITEMS_BY_SKILL } from "./items";
import type {
  Answer,
  CecrlLevel,
  EvaluationFlag,
  EvaluationResult,
  Skill,
} from "./types";
import { SKILL_ORDER } from "./types";

const LEVEL_VALUE: Record<CecrlLevel, number> = {
  A1: 20,
  A2: 40,
  B1: 60,
  B2: 80,
  C1: 100,
};

const MIN_TIME_PER_MCQ_MS = 4_000; // sous 4s = trop rapide

function scoreToLevel(score: number): CecrlLevel {
  if (score >= 90) return "C1";
  if (score >= 70) return "B2";
  if (score >= 55) return "B1";
  if (score >= 35) return "A2";
  return "A1";
}

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function computeResult(
  candidateName: string,
  answers: Record<string, Answer>,
): EvaluationResult {
  const perSkillScore: Record<Skill, number> = { CE: 0, CO: 0, EE: 0, EO: 0 };
  let totalTimeActiveMs = 0;
  let mcqAnsweredCount = 0;
  let mcqUnderMinTime = 0;
  let highLevelCorrect = 0;
  let lowLevelWrong = 0;

  for (const skill of SKILL_ORDER) {
    const items = ITEMS_BY_SKILL[skill];
    let acc = 0;
    let max = 0;
    for (const item of items) {
      const ans = answers[item.id];
      const itemMax = LEVEL_VALUE[item.level];
      max += itemMax;
      if (!ans) continue;
      totalTimeActiveMs += ans.timeSpentMs;
      if ("correctIndex" in item) {
        mcqAnsweredCount++;
        if (ans.timeSpentMs > 0 && ans.timeSpentMs < MIN_TIME_PER_MCQ_MS) {
          mcqUnderMinTime++;
        }
        const correct = ans.choiceIndex === item.correctIndex;
        if (correct) {
          acc += itemMax;
          if (LEVEL_VALUE[item.level] >= 80) highLevelCorrect++;
        } else if (LEVEL_VALUE[item.level] <= 40) {
          lowLevelWrong++;
        }
      } else {
        const wc = wordCount(ans.text);
        const ratio = Math.min(1, wc / item.minWords);
        const partial = itemMax * ratio;
        acc += partial;
      }
    }
    perSkillScore[skill] = max > 0 ? Math.round((acc / max) * 100) : 0;
  }

  // Détection de fatigue : score moyen de la 2e moitié plus faible que la 1re.
  const itemIds = ITEMS.map((i) => i.id);
  const mid = Math.floor(itemIds.length / 2);
  const half = (ids: string[]) => {
    let g = 0;
    let n = 0;
    for (const id of ids) {
      const ans = answers[id];
      const item = ITEMS.find((i) => i.id === id);
      if (!ans || !item) continue;
      n++;
      if ("correctIndex" in item) {
        g += ans.choiceIndex === item.correctIndex ? 1 : 0;
      } else {
        g += Math.min(1, wordCount(ans.text) / item.minWords);
      }
    }
    return n > 0 ? g / n : 0;
  };
  const firstHalf = half(itemIds.slice(0, mid));
  const secondHalf = half(itemIds.slice(mid));

  const flags: EvaluationFlag[] = [];
  if (mcqAnsweredCount >= 4 && mcqUnderMinTime / mcqAnsweredCount >= 0.5) {
    flags.push("ALERTE_VITESSE_INCOHERENTE");
  }
  if (highLevelCorrect >= 2 && lowLevelWrong >= 1) {
    flags.push("PROFIL_INCOHERENT");
  }
  const oralAvg = (perSkillScore.CO + perSkillScore.EO) / 2;
  const writtenAvg = (perSkillScore.CE + perSkillScore.EE) / 2;
  if (Math.abs(oralAvg - writtenAvg) >= 25) {
    flags.push("PROFIL_ASYMETRIQUE");
  }
  if (firstHalf - secondHalf >= 0.25) {
    flags.push("FATIGUE_DETECTEE");
  }
  const avgTimePerItemMs =
    Object.values(answers).length > 0
      ? totalTimeActiveMs / Object.values(answers).length
      : 0;
  if (avgTimePerItemMs > 0 && avgTimePerItemMs < 6_000) {
    flags.push("RYTHME_TRES_RAPIDE");
  }

  const perSkillLevel: Record<Skill, CecrlLevel> = {
    CE: scoreToLevel(perSkillScore.CE),
    CO: scoreToLevel(perSkillScore.CO),
    EE: scoreToLevel(perSkillScore.EE),
    EO: scoreToLevel(perSkillScore.EO),
  };
  const globalScore = Math.round(
    (perSkillScore.CE + perSkillScore.CO + perSkillScore.EE + perSkillScore.EO) / 4,
  );
  const globalLevel = scoreToLevel(globalScore);

  // Analyse narrative locale (placeholder — l'Edge Function fournira la version finale).
  const sortedSkills = SKILL_ORDER.slice().sort(
    (a, b) => perSkillScore[b] - perSkillScore[a],
  );
  const labels: Record<Skill, string> = {
    CE: "compréhension écrite",
    CO: "compréhension orale",
    EE: "expression écrite",
    EO: "expression orale",
  };
  const strengths = sortedSkills
    .slice(0, 2)
    .map((s) => `Bonne ${labels[s]} (score ${perSkillScore[s]}/100, niveau ${perSkillLevel[s]}).`);
  const improvements = sortedSkills
    .slice(-2)
    .map((s) => `À renforcer : ${labels[s]} (score ${perSkillScore[s]}/100).`);
  const expertOpinion = flags.includes("ALERTE_VITESSE_INCOHERENTE") || flags.includes("PROFIL_INCOHERENT")
    ? `Votre profil présente des signaux contrastés. Un entretien avec un expert humain est recommandé pour valider votre niveau ${globalLevel} avant d'orienter votre parcours.`
    : `Votre niveau global estimé est ${globalLevel}. Le parcours conseillé est un module ciblé sur vos axes les plus faibles, avec des points réguliers de suivi pédagogique.`;

  return {
    candidateName,
    scores: perSkillScore,
    globalLevel,
    perSkillLevel,
    totalTimeActiveMs,
    flags,
    narrative: { strengths, improvements, expertOpinion },
    completedAt: new Date().toISOString(),
  };
}
