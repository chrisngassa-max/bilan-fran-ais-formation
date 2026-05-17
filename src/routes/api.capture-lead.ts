import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { envoyerEmailBilan } from "@/utils/email-bilan";

export const Route = createFileRoute("/api/capture-lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json();

          // 1. Validation
          if (!payload.first_name || typeof payload.first_name !== "string" || !payload.first_name.trim()) {
            return Response.json({ error: "Prénom requis" }, { status: 400 });
          }
          if (!payload.email && !payload.whatsapp_phone) {
            return Response.json({ error: "Email ou WhatsApp requis" }, { status: 400 });
          }
          if (!payload.consent_training && payload.lead_type !== "admin_support") {
            return Response.json({ error: "Consentement formation requis" }, { status: 400 });
          }

          const leadType = payload.lead_type || (payload.consent_partner ? "combined" : "training");
          const partnerStatus = payload.consent_partner ? "partner_requested_but_unassigned" : "unassigned";

          const leadData = {
            source: payload.source || "bilan_post_result",
            lead_type: leadType,
            first_name: payload.first_name.trim(),
            last_name: payload.last_name ? payload.last_name.trim() : null,
            email: payload.email ? payload.email.trim().toLowerCase() : null,
            whatsapp_phone: payload.whatsapp_phone ? payload.whatsapp_phone.trim() : null,
            estimated_level: payload.estimated_level || null,
            goal: payload.goal || null,
            partner_request_type: payload.partner_request_type || null,
            message: payload.message || null,
            consent_training: !!payload.consent_training,
            consent_partner: !!payload.consent_partner,
            consent_training_text_version: payload.consent_training_text_version || "v1.0",
            consent_partner_text_version: payload.consent_partner_text_version || "v1.0",
            consent_timestamp: payload.consent_timestamp ? new Date(payload.consent_timestamp).toISOString() : new Date().toISOString(),
            status: "new",
            partner_status: partnerStatus,
            partner_id: null, // aucun partenaire actif en V1
          };

          // 2. Créer le lead en base via supabaseAdmin (RLS bypass)
          const { data: lead, error: dbError } = await supabaseAdmin
            .from("leads")
            .insert(leadData)
            .select()
            .single();

          if (dbError) {
            console.error("[api/capture-lead] Database insert failed:", dbError);
            return Response.json({ error: "Impossible d'enregistrer le lead en base de données" }, { status: 500 });
          }

          // 3. Envoi email formation si consentement et email fourni
          if (lead.consent_training && lead.email) {
            try {
              await envoyerEmailBilan({
                id: lead.id,
                first_name: lead.first_name,
                last_name: lead.last_name,
                email: lead.email,
                whatsapp_phone: lead.whatsapp_phone,
                estimated_level: lead.estimated_level,
                goal: lead.goal,
                consent_training: lead.consent_training,
                consent_partner: lead.consent_partner,
                consent_training_text_version: lead.consent_training_text_version,
                consent_partner_text_version: lead.consent_partner_text_version,
                consent_timestamp: lead.consent_timestamp,
                status: lead.status,
                partner_status: lead.partner_status,
              });
            } catch (emailErr) {
              console.error("[api/capture-lead] Failed to send email, but lead was saved:", emailErr);
              // On retourne quand même un succès car le lead est en base
            }
          }

          // 4. Retour
          return Response.json({ success: true, lead_id: lead.id });
        } catch (err: any) {
          console.error("[api/capture-lead] Catastrophic error:", err);
          return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
