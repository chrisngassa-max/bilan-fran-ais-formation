import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type NiveauIndicatif, type Journey } from "@/types/bilan";

export const FALLBACK_JOURNEYS: Journey[] = [
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
    objective: "Atteindre le niveau B1 exigé pour la carte de résident de 10 ans.",
    hours: 100,
    sessions: 50,
    publicPrice: 3500,
    financedReferencePrice: 2200,
    monthlyInstallment: 1166,
    isMostRequested: true,
    description: "Le parcours de franchissement de seuil le plus demandé pour valider votre carte de résident.",
    examTarget: "TCF IRN / DELF B1",
    reassurance: "1 formateur référent · 6 élèves max · Paiement x3"
  },
  {
    id: "Objectif-Citoyennete-B1-B2",
    fromLevel: "B1",
    toLevel: "B2",
    name: "Naturalisation — Niveau B2",
    objective: "Atteindre le niveau B2 requis pour la demande de nationalité française (obligatoire depuis 2026).",
    hours: 120,
    sessions: 60,
    publicPrice: 4800,
    financedReferencePrice: 2900,
    monthlyInstallment: 1600,
    isMostRequested: false,
    description: "Préparation complète au niveau B2 désormais exigé pour la naturalisation française.",
    examTarget: "TCF ou DELF B2",
    reassurance: "1 formateur référent · 6 élèves max · Paiement x3"
  }
];

export function mapDbOfferToJourney(offer: any): Journey {
  return {
    id: offer.code,
    fromLevel: offer.niveau_minimum as NiveauIndicatif | "A0",
    toLevel: offer.niveau_maximum as NiveauIndicatif,
    name: offer.titre,
    objective: offer.objective || "",
    hours: offer.duree_heures || 0,
    sessions: offer.sessions || 0,
    publicPrice: offer.public_price_eur || 0,
    financedReferencePrice: offer.financed_reference_price_eur || 0,
    monthlyInstallment: offer.monthly_installment_eur || 0,
    isMostRequested: !!offer.is_most_requested,
    description: offer.description || "",
    examTarget: offer.exam_target || "",
    reassurance: offer.reassurance || "",
  };
}

export function getRecommendedJourneyFromList(journeys: Journey[], level: NiveauIndicatif): Journey {
  switch (level) {
    case "A1":
      return journeys.find(j => j.id === "Objectif-Sejour-A1-A2") || journeys[1] || journeys[0];
    case "A2":
      return journeys.find(j => j.id === "Objectif-Residence-A2-B1") || journeys[2] || journeys[0];
    case "B1":
      return journeys.find(j => j.id === "Objectif-Citoyennete-B1-B2") || journeys[3] || journeys[0];
    case "B2":
      return journeys.find(j => j.id === "Objectif-Citoyennete-B1-B2") || journeys[3] || journeys[0];
    case "a_verifier":
    default:
      return journeys.find(j => j.id === "Objectif-Residence-A2-B1") || journeys[2] || journeys[0];
  }
}

export function useFormationOffers() {
  return useQuery({
    queryKey: ["formation-offers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("formation_journeys" as any)
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error || !data || (data as any[]).length === 0) {
          if (error) console.warn("[useFormationOffers] table missing or error, using fallback:", error.message);
          return FALLBACK_JOURNEYS;
        }
        return (data as any[]).map(mapDbOfferToJourney);
      } catch (e) {
        console.warn("[useFormationOffers] exception, using fallback:", e);
        return FALLBACK_JOURNEYS;
      }
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
