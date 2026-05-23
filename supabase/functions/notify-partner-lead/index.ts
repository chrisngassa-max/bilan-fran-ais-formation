import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const payload = await req.json()
    const { dossier_id, lead_id, solde_cpf, status_emploi, reste_a_charge, attempt_id } = payload ?? {}

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select("first_name, estimated_level, consent_partner, whatsapp_phone")
      .eq("id", lead_id)
      .maybeSingle()

    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: leadErr?.message ?? "lead not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (lead.consent_partner === false) {
      return new Response(JSON.stringify({ success: false, reason: "no_consent" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    await supabaseAdmin.from("lead_events").insert({
      lead_id,
      event_name: "notify_partner_lead_triggered",
      properties: { dossier_id, solde_cpf, status_emploi, reste_a_charge, attempt_id, tunnel: "T3" },
    })

    const webhookUrl = Deno.env.get("PARTENAIRE_WEBHOOK_URL")
    if (webhookUrl && webhookUrl.length > 0) {
      const now = new Date().toISOString()
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nouveau_lead_qualifie",
          prenom: lead.first_name,
          whatsapp: lead.whatsapp_phone,
          niveau_estime: lead.estimated_level,
          source_tunnel: "T3",
          solde_cpf,
          status_emploi,
          reste_a_charge,
          consent_at: now,
          timestamp: now,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
