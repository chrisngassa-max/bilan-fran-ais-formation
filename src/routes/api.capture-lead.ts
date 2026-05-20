import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { envoyerEmailBilan } from "@/utils/email-bilan";
import { notifierPartenaire } from "@/utils/webhook-partenaire";

export const Route = createFileRoute("/api/capture-lead")({
  head: () => ({
    meta: [{ title: "Capture Lead API" }],
  }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = await request.json();
          console.log("[api/capture-lead] Received payload:", payload);

          // 1. Standardize / Normalize Fields from T1, T2, T3
          const firstName = (payload.first_name || payload.prenom || "").trim();
          const lastName = (payload.last_name || "").trim() || null;
          const email = (payload.email || "").trim().toLowerCase() || null;
          const whatsappPhone = (payload.whatsapp_phone || payload.whatsapp || "").trim() || null;
          
          const tunnel = payload.tunnel || "T2_test_rapide";
          const source = payload.source || "bilan_post_result";
          const requestType = payload.partner_request_type || payload.type_demarche || null;
          const message = payload.message || null;
          const estimatedLevel = payload.estimated_level || payload.niveau_estime || null;

          // Consent handling
          const partenaireConsent = !!(payload.consent_partner || payload.partenaire_consent);
          const whatsappConsent = !!(payload.consent_whatsapp || payload.whatsapp_consent);
          const consentTraining = payload.consent_training !== undefined ? !!payload.consent_training : true;

          // 2. Validations
          if (!firstName) {
            return Response.json({ error: "Le prénom est obligatoire." }, { status: 400 });
          }

          if (!email && !whatsappPhone) {
            return Response.json({ error: "L'adresse email ou le numéro WhatsApp est obligatoire." }, { status: 400 });
          }

          // 3. Determine Lead Type & Routing Destination
          // T1 is partner-only, others depend on partenaireConsent
          let destination = "formation";
          if (tunnel === "T1_administratif_direct") {
            destination = "partenaire";
          } else if (partenaireConsent) {
            destination = "les_deux";
          }

          const leadType = payload.lead_type || (destination === "les_deux" ? "combined" : (destination === "partenaire" ? "admin_support" : "training"));
          const partnerStatus = destination === "partenaire" || destination === "les_deux" 
            ? "partner_requested_but_unassigned" 
            : "unassigned";

          const leadData = {
            source,
            lead_type: leadType,
            first_name: firstName,
            last_name: lastName,
            email,
            whatsapp_phone: whatsappPhone,
            estimated_level: estimatedLevel,
            goal: requestType,
            partner_request_type: requestType,
            message,
            consent_training: consentTraining,
            consent_partner: partenaireConsent,
            consent_training_text_version: "v1.0",
            consent_partner_text_version: "v1.0",
            consent_timestamp: payload.consent_at || new Date().toISOString(),
            status: "new",
            partner_status: partnerStatus,
            partner_id: null,
            attempt_id: payload.attempt_id || null,
            
            // New Sprint 3 Columns
            tunnel,
            whatsapp_consent: whatsappConsent,
            consent_at: payload.consent_at || new Date().toISOString(),
            destination,
            demarche_inconnue: requestType === "je_ne_sais_pas" || !!payload.demarche_inconnue,
            financement_opt_in: !!payload.financement_opt_in,
            partenaire_opt_in: partenaireConsent,
            type_demarche: requestType,
            situation_pro: payload.situation_pro || null,
            date_rdv_prefecture: payload.date_rdv || payload.date_rdv_prefecture || null,
            
            // Capture V3 Flags and Diagnostics in metadata
            metadata: {
              flags: payload.flags || [],
              reliability_by_level: payload.reliability_by_level || {},
              time_metrics: payload.time_metrics || {}
            }
          };

          // 4. Create Lead in Database (Bypasses RLS safely via Service Role client)
          const { data: lead, error: dbError } = await supabaseAdmin
            .from("leads")
            .insert(leadData)
            .select()
            .single();

          if (dbError) {
            console.error("[api/capture-lead] Database insert failed:", dbError);
            return Response.json({ error: "Impossible d'enregistrer le lead en base de données" }, { status: 500 });
          }

          console.log("[api/capture-lead] Lead successfully captured:", lead.id);

          // Trigger Partner Webhook if applicable (Sprint 3 routing and consent rules)
          if (lead.consent_partner && lead.destination !== "formation") {
            try {
              await notifierPartenaire({
                id: lead.id,
                prenom: lead.first_name,
                whatsapp: lead.whatsapp_phone || undefined,
                type_demarche: lead.partner_request_type || undefined,
                niveau_estime: lead.estimated_level || undefined,
                tunnel: lead.tunnel,
                date_rdv: lead.date_rdv || undefined,
                dispense_demandee: !!payload.dispense_demandee,
                profil_incoherent: lead.tunnel === "T3_test_complet" && !!payload.profil_incoherent,
                consent_at: lead.consent_at || new Date().toISOString()
              }, lead.consent_partner);
              console.log("[api/capture-lead] Partner webhook successfully triggered.");
            } catch (whErr) {
              console.error("[api/capture-lead] Partner webhook notification failed:", whErr);
            }
          }

          // 5. Store Checklist States if provided (Sprint 3 relational schema)
          if (payload.docs_checklist || payload.docs_manquants !== undefined) {
            const checklistData = {
              lead_id: lead.id,
              docs_checklist: payload.docs_checklist || {},
              docs_manquants: payload.docs_manquants || 0,
              attestation_ok: !!payload.attestation_ok,
              dispense_demandee: !!payload.dispense_demandee,
            };

            const { error: chkError } = await supabaseAdmin
              .from("checklist_states")
              .insert(checklistData);

            if (chkError) {
              console.warn("[api/capture-lead] Failed to insert checklist state:", chkError);
            } else {
              console.log("[api/capture-lead] Checklist state saved for lead:", lead.id);
            }
          }

          // 6. Send transactional emails if applicable
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
            }
          }

          return Response.json({ success: true, lead_id: lead.id });
        } catch (err: any) {
          console.error("[api/capture-lead] Catastrophic error:", err);
          return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
