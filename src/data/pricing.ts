import { NiveauIndicatif } from "@/types/bilan";

export interface Journey {
  id: string;
  fromLevel: NiveauIndicatif | "A0";
  toLevel: NiveauIndicatif;
  name: string;
  objective: string;
  hours: number;
  sessions: number;
  publicPrice: number;
  financedReferencePrice: number;
  monthlyInstallment: number;
  isMostRequested: boolean;
  description: string;
  examTarget: string;
  reassurance: string;
}

export const JOURNEYS: Journey[] = [
  {
    id: "Socle-Francais-A0-A1",
    fromLevel: "A0",
    toLevel: "A1",
    name: "Socle Français",
    objective: "Acquérir les bases indispensables de la langue française pour le quotidien.",
    hours: 80,
    sessions: 40,
    publicPrice: 2400,
    financedReferencePrice: 1500,
    monthlyInstallment: 800,
    isMostRequested: false,
    description: "Idéal pour débuter sereinement et maîtriser les bases fondamentales à l'écrit comme à l'oral.",
    examTarget: "Validation des compétences fondamentales",
    reassurance: "1 formateur référent · 6 élèves max · Paiement x3"
  },
  {
    id: "Objectif-Sejour-A1-A2",
    fromLevel: "A1",
    toLevel: "A2",
    name: "Objectif Séjour",
    objective: "Valider le niveau requis pour votre carte de séjour pluriannuelle ou de résident.",
    hours: 80,
    sessions: 40,
    publicPrice: 2800,
    financedReferencePrice: 1800,
    monthlyInstallment: 933,
    isMostRequested: false,
    description: "Parfait pour sécuriser votre renouvellement ou votre première carte pluriannuelle.",
    examTarget: "DELF A2 / TEF Carte de Résident",
    reassurance: "1 formateur référent · 6 élèves max · Paiement x3"
  },
  {
    id: "Objectif-Residence-A2-B1",
    fromLevel: "A2",
    toLevel: "B1",
    name: "Objectif Résidence",
    objective: "Atteindre le niveau B1 exigé pour la carte de résident de 10 ans et la naturalisation.",
    hours: 100,
    sessions: 50,
    publicPrice: 3500,
    financedReferencePrice: 2200,
    monthlyInstallment: 1166,
    isMostRequested: true,
    description: "Le parcours de franchissement de seuil le plus demandé pour valider votre intégration.",
    examTarget: "TCF IRN / DELF B1",
    reassurance: "1 formateur référent · 6 élèves max · Paiement x3"
  },
  {
    id: "Objectif-Citoyennete-B1-B2",
    fromLevel: "B1",
    toLevel: "B2",
    name: "Objectif Citoyenneté",
    objective: "Assurer une expression fluide et une aisance parfaite pour sécuriser votre projet.",
    hours: 120,
    sessions: 60,
    publicPrice: 4800,
    financedReferencePrice: 2900,
    monthlyInstallment: 1600,
    isMostRequested: false,
    description: "Une préparation avancée pour une intégration professionnelle et citoyenne totale.",
    examTarget: "DELF B2 / TCF Tout Public",
    reassurance: "1 formateur référent · 6 élèves max · Paiement x3"
  }
];

/**
 * Retourne le parcours recommandé selon le niveau indicatif estimé.
 */
export function getRecommendedJourney(level: NiveauIndicatif): Journey {
  // Nettoyer les cas B1_nat
  const cleanLevel = level === "B1_nat" ? "B1" : level;

  switch (cleanLevel) {
    case "A1":
      return JOURNEYS.find(j => j.id === "Objectif-Sejour-A1-A2") || JOURNEYS[1];
    case "A2":
      return JOURNEYS.find(j => j.id === "Objectif-Residence-A2-B1") || JOURNEYS[2];
    case "B1":
      return JOURNEYS.find(j => j.id === "Objectif-Citoyennete-B1-B2") || JOURNEYS[3];
    case "B2":
      // Si déjà B2, on recommande Objectif Citoyenneté (B1_B2) pour de l'entretien et de l'excellence
      return JOURNEYS.find(j => j.id === "Objectif-Citoyennete-B1-B2") || JOURNEYS[3];
    case "a_verifier":
    default:
      // Par défaut, parcours le plus demandé : Objectif Résidence (A2_B1)
      return JOURNEYS.find(j => j.id === "Objectif-Residence-A2-B1") || JOURNEYS[2];
  }
}

/**
 * Retourne une formule express accélérée si le délai est urgent.
 */
export function getExpressOffer(level: NiveauIndicatif, urgencyDays: number) {
  const journey = getRecommendedJourney(level);
  
  // Si le rendez-vous est dans moins de 30 jours, on accélère le rythme
  const rhythm = urgencyDays <= 14 
    ? "Ultra-Intensif (jusqu'à 2 séances par jour)" 
    : "Intensif (1 séance par jour)";

  return {
    ...journey,
    id: `${journey.id}-EXPRESS`,
    name: `${journey.name} - FORMULE EXPRESS`,
    rhythm,
    description: `Formule accélérée conçue spécifiquement pour votre délai de ${urgencyDays} jours.`
  };
}
