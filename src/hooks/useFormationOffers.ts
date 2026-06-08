import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { type Journey } from "@/types/bilan";
import { FALLBACK_JOURNEYS, mapDbOfferToJourney } from "@/utils/formation-offers.shared";

export { FALLBACK_JOURNEYS, mapDbOfferToJourney, getRecommendedJourneyFromList } from "@/utils/formation-offers.shared";

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
