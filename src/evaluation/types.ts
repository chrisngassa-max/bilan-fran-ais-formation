// Types pour l'évaluation linguistique experte (inspirée du référentiel CECRL).

export type Skill = "CE" | "CO" | "EE" | "EO";
export type CecrlLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const SKILL_LABELS: Record<Skill, string> = {
  CE: "Compréhension écrite",
  CO: "Compréhension orale",
  EE: "Expression écrite",
  EO: "Expression orale",
};

export const SKILL_ORDER: Skill[] = ["CE", "CO", "EE", "EO"];

export type McqItem = {
  id: string;
  skill: "CE" | "CO";
  level: CecrlLevel;
  prompt: string;
  audioLabel?: string; // pour CO (placeholder, pas d'audio réel en mock)
  passage?: string; // pour CE
  choices: string[];
  correctIndex: number;
};

export type OpenItem = {
  id: string;
  skill: "EE" | "EO";
  level: CecrlLevel;
  prompt: string;
  minWords: number; // estimation
};

export type AnyItem = McqItem | OpenItem;

export type Answer = {
  itemId: string;
  // Pour QCM : index choisi. Pour ouvert : longueur en mots.
  choiceIndex?: number;
  text?: string;
  timeSpentMs: number; // temps actif uniquement
};

export type EvaluationFlag =
  | "FATIGUE_DETECTEE"
  | "ALERTE_VITESSE_INCOHERENTE"
  | "PROFIL_INCOHERENT"
  | "PROFIL_ASYMETRIQUE"
  | "RYTHME_TRES_RAPIDE";

export const FLAG_DEFINITIONS: Record<
  EvaluationFlag,
  { label: string; description: string; severity: "info" | "warning" | "critical" }
> = {
  FATIGUE_DETECTEE: {
    label: "Fatigue détectée",
    description: "Le rythme et la précision baissent en fin d'évaluation.",
    severity: "warning",
  },
  ALERTE_VITESSE_INCOHERENTE: {
    label: "Vitesse incohérente",
    description:
      "Des questions complexes ont été traitées en un temps anormalement court.",
    severity: "critical",
  },
  PROFIL_INCOHERENT: {
    label: "Profil incohérent",
    description:
      "Réussite avancée sur certaines compétences, échec sur des items basiques.",
    severity: "critical",
  },
  PROFIL_ASYMETRIQUE: {
    label: "Profil asymétrique",
    description:
      "Écart important entre vos compétences orales et écrites.",
    severity: "info",
  },
  RYTHME_TRES_RAPIDE: {
    label: "Rythme très rapide",
    description: "Temps moyen par question très inférieur à la médiane attendue.",
    severity: "info",
  },
};

export type EvaluationResult = {
  candidateName: string;
  scores: Record<Skill, number>; // 0–100
  globalLevel: CecrlLevel;
  perSkillLevel: Record<Skill, CecrlLevel>;
  totalTimeActiveMs: number;
  flags: EvaluationFlag[];
  narrative: {
    strengths: string[];
    improvements: string[];
    expertOpinion: string;
  };
  completedAt: string;
};

export type EvaluationProgress = {
  candidateName: string;
  startedAt: string;
  currentIndex: number; // index dans la liste plate des items
  answers: Record<string, Answer>;
};
