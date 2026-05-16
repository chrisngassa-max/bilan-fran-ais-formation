import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LeadSchema = z.object({
  email: z.string().trim().email().max(255),
  whatsapp_phone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[+\d\s().-]*$/)
    .optional()
    .or(z.literal("")),
  consent_marketing: z.literal(true),
  attempt_id: z.string().uuid().nullable().optional(),
  estimated_level: z.string().max(8).nullable().optional(),
  source: z.string().max(64).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const captureBilanLead = createServerFn({ method: "POST" })
  .inputValidator((input) => LeadSchema.parse(input))
  .handler(async ({ data }) => {
    const payload = {
      email: data.email.toLowerCase(),
      whatsapp_phone: data.whatsapp_phone || null,
      consent_marketing: data.consent_marketing,
      attempt_id: data.attempt_id ?? null,
      estimated_level: data.estimated_level ?? null,
      source: data.source ?? "bilan_capture",
      metadata: data.metadata ?? {},
      status: "new",
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[captureBilanLead] insert failed", error);
      throw new Error("Impossible d'enregistrer votre demande pour l'instant.");
    }

    // TODO: Envoyer l'email transactionnel via Lovable Emails (bilan + guide pratique).
    // L'envoi nécessite un domaine email vérifié (`captcf.fr` est en `provisioning_failed`).
    // Une fois le domaine actif, brancher ici : supabase.rpc('enqueue_email', { ... })
    // avec la queue `transactional_emails` et le template `bilan-recu`.

    return { id: inserted.id, ok: true };
  });
