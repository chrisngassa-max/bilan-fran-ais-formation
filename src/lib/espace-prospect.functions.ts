import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validerToken } from "@/utils/magic-link";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const validerMagicLinkFn = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ token: z.string().min(10).max(200) }).parse(i))
  .handler(async ({ data }) => {
    const lead_id = await validerToken(data.token);
    if (!lead_id) return { ok: false as const, raison: "token_invalide" as const };
    return { ok: true as const, lead_id };
  });

export const getEspaceProspectFn = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ lead_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select(
        "id,prenom,type_demarche,estimated_level,checklist_states,situation_pro,created_at,status,date_rdv_prefecture,dispense_demandee",
      )
      .eq("id", data.lead_id)
      .maybeSingle();

    if (leadErr || !lead) {
      throw new Error("Prospect introuvable");
    }

    const { data: session } = await supabaseAdmin
      .from("test_sessions")
      .select("niveau_estime,scores,created_at,production_feedback")
      .eq("lead_id", data.lead_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return { lead, session };
  });

export const updateChecklistFn = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        lead_id: z.string().uuid(),
        checklist_states: z.record(z.string().min(1).max(64), z.boolean()),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("leads")
      .update({ checklist_states: data.checklist_states })
      .eq("id", data.lead_id);

    if (error) {
      console.error("[updateChecklistFn] update failed", error);
      throw new Error("Mise à jour de la checklist impossible");
    }
    return { ok: true as const };
  });
