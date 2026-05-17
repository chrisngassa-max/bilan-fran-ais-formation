/**
 * Magic links — SERVEUR UNIQUEMENT.
 * Génération et validation de tokens à usage unique (30 jours) pour l'espace prospect.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function assertServeur() {
  if (typeof window !== "undefined") {
    throw new Error("magic-link: serveur uniquement");
  }
}

export async function genererMagicLink(lead_id: string): Promise<string> {
  assertServeur();

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 30);

  const { data, error } = await supabaseAdmin
    .from("magic_links")
    .insert({
      lead_id,
      expires_at: expires_at.toISOString(),
      used: false,
    })
    .select("token")
    .single();

  if (error || !data) {
    console.error("[magic-link] insert failed", error);
    throw new Error("Impossible de générer le magic link");
  }

  const baseUrl =
    process.env.BASE_URL ??
    process.env.VITE_APP_URL ??
    "https://bilanfrancaisformation.lovable.app";

  return `${baseUrl}/mon-espace?token=${data.token}`;
}

/**
 * Valide un token magic link. Si valide → le marque utilisé et retourne lead_id.
 * Sinon retourne null.
 */
export async function validerToken(token: string): Promise<string | null> {
  assertServeur();
  if (!token || token.length < 10) return null;

  const { data, error } = await supabaseAdmin
    .from("magic_links")
    .select("id, lead_id, expires_at, used")
    .eq("token", token)
    .maybeSingle();

  if (error || !data || data.used || !data.lead_id) return null;
  if (new Date() > new Date(data.expires_at)) return null;

  await supabaseAdmin
    .from("magic_links")
    .update({ used: true })
    .eq("id", data.id);

  return data.lead_id;
}
