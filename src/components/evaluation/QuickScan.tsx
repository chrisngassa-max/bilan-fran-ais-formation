import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/bff/Button";
import { saveQuickScan, type QuickScanResult } from "@/evaluation/storage";
import { trackEvent } from "@/lib/analytics";

type Q = {
  id: string;
  prompt: string;
  level: 1 | 2 | 3 | 4;
  choices: string[];
  correctIndex: number;
};

const QUESTIONS: Q[] = [
  {
    id: "q1",
    level: 1,
    prompt: "Que dit la personne ? « Bonjour, je voudrais un café, s'il vous plaît. »",
    choices: ["Elle salue et commande un café.", "Elle dit au revoir.", "Elle demande l'heure."],
    correctIndex: 0,
  },
  {
    id: "q2",
    level: 2,
    prompt: "Quel mot complète : « Hier, je _____ au cinéma avec mes amis. »",
    choices: ["vais", "suis allé", "irai"],
    correctIndex: 1,
  },
  {
    id: "q3",
    level: 3,
    prompt: "Que signifie : « Il pleut des cordes. »",
    choices: ["Il fait beau.", "Il pleut très fort.", "Il y a du vent."],
    correctIndex: 1,
  },
  {
    id: "q4",
    level: 3,
    prompt: "Quel temps utiliser ? « Si j'avais le temps, je _____ plus souvent. »",
    choices: ["lirais", "lis", "lirai"],
    correctIndex: 0,
  },
  {
    id: "q5",
    level: 4,
    prompt: "Quelle phrase exprime une concession ?",
    choices: [
      "Bien qu'il soit fatigué, il continue à travailler.",
      "Il est fatigué donc il dort.",
      "Il est fatigué parce qu'il a couru.",
    ],
    correctIndex: 0,
  },
];

const RANGES: Array<{ min: number; max: number; low: QuickScanResult["rangeLow"]; high: QuickScanResult["rangeHigh"]; label: string }> = [
  { min: 0, max: 2, low: "A1", high: "A2", label: "A1 → A2" },
  { min: 3, max: 5, low: "A2", high: "B1", label: "A2 → B1" },
  { min: 6, max: 8, low: "B1", high: "B2", label: "B1 → B2" },
  { min: 9, max: 13, low: "B2", high: "C1", label: "B2 → C1" },
];

function scoreToRange(score: number) {
  return RANGES.find((r) => score >= r.min && score <= r.max) ?? RANGES[0];
}

export function QuickScan() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const rawScore = QUESTIONS.reduce((acc, q) => {
    const a = answers[q.id];
    if (a === undefined) return acc;
    return acc + (a === q.correctIndex ? q.level : 0);
  }, 0);

  function handleAnswer(idx: number) {
    if (!current) return;
    const next = { ...answers, [current.id]: idx };
    setAnswers(next);
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      const computed = QUESTIONS.reduce((acc, q) => {
        const a = next[q.id];
        if (a === undefined) return acc;
        return acc + (a === q.correctIndex ? q.level : 0);
      }, 0);
      const r = scoreToRange(computed);
      saveQuickScan({ rangeLow: r.low, rangeHigh: r.high, rawScore: computed });
      setDone(true);
      trackEvent("simulator_completed", { kind: "quickscan", score: computed });
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  if (done) {
    const r = scoreToRange(rawScore);
    return (
      <div className="rounded-2xl border-2 border-[var(--color-eval-navy)] bg-surface-bright p-6 shadow-lg sm:p-8">
        <div className="flex items-center gap-2 text-[var(--color-eval-orange)]">
          <Sparkles className="h-5 w-5" />
          <span className="label-caps">Résultat du diagnostic rapide</span>
        </div>
        <h3 className="headline-lg mt-3 text-[var(--color-eval-navy)]">
          Votre profil semble se situer entre {r.low} et {r.high}
        </h3>
        <p className="body-md mt-3 text-on-surface-variant">
          Ce diagnostic en 5 questions est un repère général. Pour obtenir votre
          <strong> certificat de niveau expert </strong> et votre <strong>bilan détaillé</strong> par
          compétence (compréhension écrite, orale, expression écrite et orale), passez l'évaluation
          complète (15–20 min).
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/passer-test/$token" params={{ token: "latest" }}>
            <Button variant="primary" className="bg-[var(--color-eval-orange)] hover:opacity-90">
              Passer l'évaluation experte (Certification CECRL)
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 py-3 body-md hover:bg-surface-container"
          >
            <RotateCcw className="h-4 w-4" /> Refaire le diagnostic
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--color-eval-navy)] bg-surface-bright p-6 shadow-lg sm:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-eval-navy)]">
          <Sparkles className="h-5 w-5 text-[var(--color-eval-orange)]" />
          <span className="label-caps">Diagnostic rapide — 5 questions</span>
        </div>
        <span className="label-caps text-on-surface-variant">
          Question {step + 1} / {total}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-[var(--color-eval-orange)] transition-all"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
      {current && (
        <div className="mt-6">
          <p className="body-lg font-medium text-on-surface">{current.prompt}</p>
          <div className="mt-4 grid gap-2">
            {current.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(i)}
                className="rounded-lg border-2 border-outline-variant bg-surface-bright px-4 py-3 text-left body-md hover:border-[var(--color-eval-navy)] hover:bg-[var(--color-eval-navy-soft)] transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 body-md text-on-surface-variant">
        Évaluation Linguistique Initiale — <span className="italic">Inspiré du référentiel CECRL</span>.
      </p>
    </div>
  );
}
