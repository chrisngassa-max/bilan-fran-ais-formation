import { supabase } from "@/lib/supabase";
import { type NiveauIndicatif } from "@/types/bilan";
import { type Journey } from "@/data/pricing";
import { FALLBACK_JOURNEYS, mapDbOfferToJourney, getRecommendedJourneyFromList } from "../hooks/useFormationOffers";

export async function getFormationOffersServer(): Promise<Journey[]> {
  try {
    const { data, error } = await supabase
      .from("formation_offers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[getFormationOffersServer] Error fetching offers, using fallbacks:", error);
      return FALLBACK_JOURNEYS;
    }
    return (data || []).map(mapDbOfferToJourney);
  } catch (e) {
    console.error("[getFormationOffersServer] Exception fetching offers, using fallbacks:", e);
    return FALLBACK_JOURNEYS;
  }
}

export async function getRecommendedJourneyServer(level: NiveauIndicatif): Promise<Journey> {
  const offers = await getFormationOffersServer();
  return getRecommendedJourneyFromList(offers, level);
}
