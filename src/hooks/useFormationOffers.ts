import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type Journey } from "@/types/bilan";
import { trackEvent } from "@/lib/analytics";
import { FALLBACK_JOURNEYS, mapDbOfferToJourney } from "@/utils/formation-offers.shared";

export { FALLBACK_JOURNEYS, mapDbOfferToJourney, getRecommendedJourneyFromList } from "@/utils/formation-offers.shared";

export type FormationOffersResult = { journeys: Journey[]; degraded: boolean };

export function useFormationOffers() {
  return useQuery<FormationOffersResult>({
    queryKey: ["formation-offers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("formation_journeys" as any)
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error || !data || (data as any[]).length === 0) {
          if (error) {
            console.warn("[useFormationOffers] table missing or error, using fallback:", error.message);
            trackEvent("offers_load_error", { reason: error.message });
            return { journeys: FALLBACK_JOURNEYS, degraded: true };
          }
          // Table vide sans erreur : on sert le statique sans bandeau d'alerte
          return { journeys: FALLBACK_JOURNEYS, degraded: false };
        }
        trackEvent("offers_loaded", { count: (data as any[]).length });
        return { journeys: (data as any[]).map(mapDbOfferToJourney), degraded: false };
      } catch (e) {
        console.warn("[useFormationOffers] exception, using fallback:", e);
        trackEvent("offers_load_error", { reason: String(e) });
        return { journeys: FALLBACK_JOURNEYS, degraded: true };
      }
    },
    // Contenu statique affiché immédiatement (présent au First Contentful Paint),
    // puis hydraté avec les données Supabase. Source de vérité unique : FALLBACK_JOURNEYS.
    placeholderData: { journeys: FALLBACK_JOURNEYS, degraded: false },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
