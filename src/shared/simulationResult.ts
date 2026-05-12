export type AdminGoal =
  | "carte_pluriannuelle"
  | "carte_resident"
  | "naturalisation"
  | "travail"
  | "vie_quotidienne"
  | "preparation_tcf"
  | "remise_a_niveau"
  | "unknown";

export type TargetLevel = "A2" | "B1" | "B2" | "diagnostic_required" | "not_required";
export type EstimatedLevel = "A0" | "A1" | "A2" | "B1" | "B2" | "unknown";
export type FundingRoute =
  | "Personnel"
  | "Employeur"
  | "OPCO"
  | "FranceTravail"
  | "CPF"
  | "Partenaire";

export type Availability = "matin" | "apres_midi" | "soir" | "weekend";
export type FormatPreference = "en_ligne" | "presentiel" | "les_deux";

export type PublicSimulationResult = {
  adminGoal: AdminGoal;
  targetLevel: TargetLevel;
  estimatedLevel: EstimatedLevel;
  fundingRoutes: FundingRoute[];
  urgency: "low" | "medium" | "high";
  priorityScore: number; // 0–100
  availability: Availability[];
  formatPreference: FormatPreference;
  contact: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    city?: string;
    message?: string;
    consent: boolean;
    consentDate?: string;
  };
  source: { page: string; utmSource?: string; utmCampaign?: string };
};

export const SIMULATION_STORAGE_KEY = "bff_last_simulation";
