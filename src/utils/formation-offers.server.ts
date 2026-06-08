import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type NiveauIndicatif, type Journey } from "@/types/bilan";
import { FALLBACK_JOURNEYS, mapDbOfferToJourney, getRecommendedJourneyFromList } from "./formation-offers.shared";

export async function getFormationOffersServer(): Promise<Journey[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("formation_journeys")
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

