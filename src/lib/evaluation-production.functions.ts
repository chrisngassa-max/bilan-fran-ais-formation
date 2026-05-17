import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { evaluerProductionEcrite } from "@/utils/evaluation-ia";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { NiveauIndicatif } from "@/types/bilan";

const InputSchema = z.object({
  consigne: z.string().min(1).max(1000),
  texte_candidat: z.string().min(1).max(5000),
  niveau_cible: z.enum(["A1", "A2", "B1", "B1_nat", "B2", "a_verifier"]),
  ia_consent: z.literal(true),
  session_id: z.string().uuid().optional(),
});

export const evaluerProductionFn = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const result = await evaluerProductionEcrite({
      consigne: data.consigne,
      texte_candidat: data.texte_candidat,
      niveau_cible: data.niveau_cible as NiveauIndicatif,
    });

    if (data.session_id) {
      const { error } = await supabaseAdmin
        .from("test_sessions")
        .update({
          score_production: result.score,
          production_feedback: result as unknown as Record<string, unknown>,
          ia_evaluation_consent: true,
          ia_evaluation_consent_at: new Date().toISOString(),
        })
        .eq("id", data.session_id);
      if (error) {
        console.error("[evaluerProductionFn] update test_sessions failed:", error);
      }
    }

    return result;
  });
