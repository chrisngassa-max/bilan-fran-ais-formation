import type {
  AdminGoal,
  Availability,
  EstimatedLevel,
  FormatPreference,
  FundingRoute,
  PublicSimulationResult,
  TargetLevel,
} from "@/shared/simulationResult";
import { fundingMode } from "@/config/site";

/**
 * Barème indicatif :
 * - 9 questions de compétence linguistique notées 0..3 → max 27 points
 * - Conversion en pourcentage → estimatedLevel
 * - À recalibrer manuellement après tests réels.
 */

export type LinguisticAnswers = {
  // 0..3 chacun
  comprehension_orale: number | null;
  comprehension_ecrite: number | null;
  expression_ecrite: number | null;
  expression_orale: number | null;
  vocabulaire_admin: number | null;
  vocabulaire_travail: number | null;
  grammaire: number | null;
  prononciation: number | null;
  aisance: number | null;
};

export function scoreToLevel(percent: number): EstimatedLevel {
  if (percent <= 25) return "A0";
  if (percent <= 45) return "A1";
  if (percent <= 65) return "A2";
  if (percent <= 85) return "B1";
  return "B2";
}

export function computeEstimatedLevel(answers: LinguisticAnswers): {
  percent: number;
  level: EstimatedLevel;
} {
  const total =
    (answers.comprehension_orale ?? 0) +
    (answers.comprehension_ecrite ?? 0) +
    (answers.expression_ecrite ?? 0) +
    (answers.expression_orale ?? 0) +
    (answers.vocabulaire_admin ?? 0) +
    (answers.vocabulaire_travail ?? 0) +
    (answers.grammaire ?? 0) +
    (answers.prononciation ?? 0) +
    (answers.aisance ?? 0);
  const max = 9 * 3;
  const percent = Math.round((total / max) * 100);
  return { percent, level: scoreToLevel(percent) };
}

export function targetLevelFor(goal: AdminGoal): TargetLevel {
  switch (goal) {
    case "carte_pluriannuelle":
      return "A2";
    case "carte_resident":
      return "B1";
    case "naturalisation":
      return "B2";
    case "preparation_tcf":
      return "diagnostic_required";
    case "travail":
    case "vie_quotidienne":
    case "remise_a_niveau":
    case "unknown":
    default:
      return "not_required";
  }
}

const LEVEL_ORDER: EstimatedLevel[] = ["A0", "A1", "A2", "B1", "B2"];

export function levelGap(estimated: EstimatedLevel, target: TargetLevel): number {
  if (target === "not_required" || target === "diagnostic_required") return 0;
  if (estimated === "unknown") return 0;
  const e = LEVEL_ORDER.indexOf(estimated);
  const t = LEVEL_ORDER.indexOf(target as EstimatedLevel);
  return Math.max(0, t - e);
}

export type UrgencyInput = {
  deadlineMonths: number | null; // null = pas de deadline
  procedureStarted: boolean;
};

export function computeUrgency(input: UrgencyInput): "low" | "medium" | "high" {
  if (input.procedureStarted) return "high";
  if (input.deadlineMonths !== null && input.deadlineMonths < 3) return "high";
  if (input.deadlineMonths !== null && input.deadlineMonths < 12) return "medium";
  return "low";
}

export type PriorityInput = {
  urgency: "low" | "medium" | "high";
  adminGoal: AdminGoal;
  estimated: EstimatedLevel;
  target: TargetLevel;
  professionalProfile: boolean;
  consent: boolean;
};

export function computePriorityScore(p: PriorityInput): number {
  let s = 0;
  if (p.urgency === "high") s += 30;
  else if (p.urgency === "medium") s += 15;
  if (p.adminGoal !== "unknown") s += 20;
  const gap = levelGap(p.estimated, p.target);
  if (gap >= 2) s += 25;
  else if (gap === 1) s += 15;
  if (p.professionalProfile) s += 15;
  if (p.consent) s += 10;
  return Math.min(100, s);
}

export function fundingRoutesFor(goal: AdminGoal): FundingRoute[] {
  const base: FundingRoute[] = ["Personnel", "Employeur", "OPCO", "FranceTravail", "Partenaire"];
  if (fundingMode !== "no_qualiopi_yet") base.push("CPF");
  // Léger ordre selon objectif
  if (goal === "travail") {
    return ["Employeur", "OPCO", ...base.filter((b) => b !== "Employeur" && b !== "OPCO")];
  }
  return base;
}

export type SimulatorState = {
  linguistic: LinguisticAnswers;
  adminGoal: AdminGoal;
  deadlineMonths: number | null;
  procedureStarted: boolean;
  professionalProfile: boolean;
  availability: Availability[];
  formatPreference: FormatPreference;
};

export function buildSimulationResult(
  state: SimulatorState,
  contact: PublicSimulationResult["contact"],
  source: PublicSimulationResult["source"]
): PublicSimulationResult {
  const { level: estimatedLevel } = computeEstimatedLevel(state.linguistic);
  const targetLevel = targetLevelFor(state.adminGoal);
  const urgency = computeUrgency({
    deadlineMonths: state.deadlineMonths,
    procedureStarted: state.procedureStarted,
  });
  const priorityScore = computePriorityScore({
    urgency,
    adminGoal: state.adminGoal,
    estimated: estimatedLevel,
    target: targetLevel,
    professionalProfile: state.professionalProfile,
    consent: contact.consent,
  });
  return {
    adminGoal: state.adminGoal,
    targetLevel,
    estimatedLevel,
    fundingRoutes: fundingRoutesFor(state.adminGoal),
    urgency,
    priorityScore,
    availability: state.availability,
    formatPreference: state.formatPreference,
    contact,
    source,
  };
}
