import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireRole } from "@/integrations/supabase/require-role";

// Cast to any to bypass strict typing for tables not yet present in generated types
const supabaseAdmin: any = _supabaseAdmin;

// Schema validations
const getLeadsInputSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  level: z.string().optional(),
  source: z.string().optional(),
  leadIntent: z.string().optional(),
  partnerStatus: z.string().optional(),
  fundingOnly: z.boolean().optional(),
  fundingStatus: z.string().optional(),
  fundingFollowup: z.enum(["all", "overdue", "upcoming"]).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

const leadIdSchema = z.object({
  leadId: z.string().uuid(),
});

const updateLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.string(),
  assignedTo: z.string().uuid().nullable().optional(),
});

const fundingStatusSchema = z.enum([
  "interested",
  "to_qualify",
  "ready_to_transmit",
  "transmitted",
]);

const updateLeadFundingStatusSchema = z.object({
  leadId: z.string().uuid(),
  fundingStatus: fundingStatusSchema,
});

const fundingNextActionSchema = z.enum([
  "call_candidate",
  "complete_profile",
  "prepare_export",
  "wait_partner",
  "no_action",
]);

const updateLeadFundingQualificationSchema = z.object({
  leadId: z.string().uuid(),
  nextAction: fundingNextActionSchema.nullable(),
  followupAt: z.string().datetime().nullable(),
  internalNotes: z.string().trim().max(4000).nullable(),
});

const fundingExportAuditSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(1000),
});

const partnerSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactWhatsapp: z.string().optional(),
  status: z.enum(["draft", "active", "inactive"]),
  serviceTypes: z.array(z.string()).default([]),
  transmissionMode: z.enum(["manual_csv", "manual_pdf", "email", "future_api"]),
  receptionEmail: z.string().email().optional().or(z.literal("")),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  legalNotes: z.string().optional(),
  kbisVerified: z.boolean().default(false),
  insuranceVerified: z.boolean().default(false),
  contractSigned: z.boolean().default(false),
});

export const getLeadsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire", "conseiller"])])
  .inputValidator((input) => getLeadsInputSchema.parse(input))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("leads")
      .select("id, created_at, source, lead_type, lead_intent, first_name, last_name, email, whatsapp_phone, estimated_level, goal, status, partner_status, partner_id, assigned_to, tunnel, financement_opt_in, funding_status, funding_next_action, funding_followup_at, consent_partner, professional_status, cpf_status, france_travail_registered, metadata", { count: "exact" });

    // Apply search filter (first_name, last_name, email, phone)
    if (data.search && data.search.trim() !== "") {
      const s = `%${data.search.trim()}%`;
      query = query.or(`first_name.ilike.${s},last_name.ilike.${s},email.ilike.${s},whatsapp_phone.ilike.${s}`);
    }

    // Apply category filters
    if (data.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }
    if (data.level && data.level !== "all") {
      query = query.eq("estimated_level", data.level);
    }
    if (data.source && data.source !== "all") {
      query = query.eq("source", data.source);
    }
    if (data.leadIntent && data.leadIntent !== "all") {
      query = query.eq("lead_intent", data.leadIntent);
    }
    if (data.partnerStatus && data.partnerStatus !== "all") {
      query = query.eq("partner_status", data.partnerStatus);
    }
    if (data.fundingOnly) {
      query = query.eq("financement_opt_in", true);
    }
    if (data.fundingStatus && data.fundingStatus !== "all") {
      query = query.eq("funding_status", data.fundingStatus);
    }
    if (data.fundingFollowup === "overdue") {
      query = query
        .not("funding_followup_at", "is", null)
        .lt("funding_followup_at", new Date().toISOString());
    }
    if (data.fundingFollowup === "upcoming") {
      query = query
        .not("funding_followup_at", "is", null)
        .gte("funding_followup_at", new Date().toISOString());
    }

    // Pagination
    const from = (data.page - 1) * data.limit;
    const to = from + data.limit - 1;

    const { data: leads, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(`Failed to load leads: ${error.message}`);
    return { leads: leads ?? [], total: count ?? 0 };
  });

export const getFundingPartnerExportAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("id, created_at, first_name, last_name, email, whatsapp_phone, estimated_level, goal, source, tunnel, attempt_id, lead_intent, message, financement_opt_in, consent_partner, consent_partner_text_version, consent_timestamp, partner_status, funding_status, birth_date, nationality, address_line1, postal_code, city, professional_status, sector_activity, cpf_status, cpf_balance_declared, france_travail_registered, employer_support, funding_target_date, metadata")
      .eq("financement_opt_in", true)
      .eq("consent_partner", true)
      .eq("funding_status", "ready_to_transmit")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw new Error(`Export financement indisponible: ${error.message}`);

    return { leads: leads ?? [] };
  });

export const logFundingPartnerExportAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) => fundingExportAuditSchema.parse(input))
  .handler(async ({ data }) => {
    const exportedAt = new Date().toISOString();

    const { data: transmittedLeads, error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        funding_status: "transmitted",
        funding_next_action: "wait_partner",
        funding_followup_at: null,
        updated_at: exportedAt,
      })
      .in("id", data.leadIds)
      .eq("funding_status", "ready_to_transmit")
      .select("id");

    if (updateError) throw new Error(`Marquage transmis impossible: ${updateError.message}`);

    const transmittedLeadIds = (transmittedLeads ?? []).map((lead) => lead.id);
    if (transmittedLeadIds.length === 0) {
      throw new Error("Aucun dossier exporte n'etait encore pret a transmettre.");
    }

    const { error } = await supabaseAdmin.from("lead_events").insert(
      transmittedLeadIds.map((leadId) => ({
        lead_id: leadId,
        event_name: "funding_export_transmitted",
        properties: {
          format: "csv",
          scope: "funding_partner_prequalification",
          exported_at: exportedAt,
          previous_funding_status: "ready_to_transmit",
          new_funding_status: "transmitted",
        },
      })),
    );

    if (error) throw new Error(`Trace export financement indisponible: ${error.message}`);

    return { ok: true, count: transmittedLeadIds.length };
  });

export const getLeadDetailAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire", "conseiller"])])
  .inputValidator((input) => leadIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .maybeSingle();

    if (error || !lead) throw new Error("Prospect introuvable");

    // Fetch related test_sessions
    const { data: sessions } = await supabaseAdmin
      .from("test_sessions")
      .select("*")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false });

    // Fetch related events
    const { data: events } = await supabaseAdmin
      .from("lead_events")
      .select("*")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false });

    // Fetch related partner transmissions
    const { data: transmissions } = await supabaseAdmin
      .from("partner_transmissions")
      .select("*, partners(name)")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false });

    // Fetch latest related dossier (qualification financement)
    const { data: dossier } = await supabaseAdmin
      .from("dossiers")
      .select("solde_cpf, reste_a_charge, status_emploi, has_main_docs")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      lead,
      sessions: sessions ?? [],
      events: events ?? [],
      transmissions: transmissions ?? [],
      dossier: dossier ?? null,
    };
  });

export const updateLeadStatusAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire", "conseiller"])])
  .inputValidator((input) => updateLeadStatusSchema.parse(input))
  .handler(async ({ data }) => {
    const updatePayload: Record<string, any> = {
      status: data.status,
      updated_at: new Date().toISOString()
    };
    
    if (data.assignedTo !== undefined) {
      updatePayload.assigned_to = data.assignedTo;
    }

    const { error } = await supabaseAdmin
      .from("leads")
      .update(updatePayload)
      .eq("id", data.leadId);

    if (error) throw new Error("Impossible de modifier le dossier");

    // Trace in events
    await supabaseAdmin.from("lead_events").insert({
      lead_id: data.leadId,
      event_name: "status_changed",
      properties: { 
        new_status: data.status,
        assigned_to: data.assignedTo ?? null
      }
    });

    return { ok: true };
  });

export const updateLeadFundingStatusAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire", "conseiller"])])
  .inputValidator((input) => updateLeadFundingStatusSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.fundingStatus === "ready_to_transmit") {
      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("first_name, last_name, email, whatsapp_phone, goal, consent_partner, professional_status, cpf_status, france_travail_registered")
        .eq("id", data.leadId)
        .maybeSingle();

      if (leadError || !lead) throw new Error("Prospect introuvable pour la qualification financement");

      const missingFields = getFundingReadinessMissingFields(lead);
      if (missingFields.length > 0) {
        throw new Error(`Dossier financement incomplet: ${missingFields.join(", ")}`);
      }
    }

    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        funding_status: data.fundingStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.leadId);

    if (error) throw new Error("Impossible de modifier le statut financement");

    await supabaseAdmin.from("lead_events").insert({
      lead_id: data.leadId,
      event_name: "funding_status_changed",
      properties: {
        new_funding_status: data.fundingStatus,
      },
    });

    return { ok: true };
  });

export const updateLeadFundingQualificationAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire", "conseiller"])])
  .inputValidator((input) => updateLeadFundingQualificationSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("leads")
      .update({
        funding_next_action: data.nextAction,
        funding_followup_at: data.followupAt,
        funding_internal_notes: data.internalNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.leadId);

    if (error) throw new Error("Impossible d'enregistrer le suivi financement");

    await supabaseAdmin.from("lead_events").insert({
      lead_id: data.leadId,
      event_name: "funding_qualification_updated",
      properties: {
        next_action: data.nextAction,
        followup_at: data.followupAt,
        has_internal_notes: !!data.internalNotes,
      },
    });

    return { ok: true };
  });

function getFundingReadinessMissingFields(lead: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  whatsapp_phone: string | null;
  goal: string | null;
  consent_partner: boolean | null;
  professional_status: string | null;
  cpf_status: string | null;
  france_travail_registered: string | null;
}) {
  const missingFields: string[] = [];

  if (!lead.consent_partner) missingFields.push("consentement partenaire financement");
  if (!lead.first_name?.trim()) missingFields.push("prenom");
  if (!lead.last_name?.trim()) missingFields.push("nom");
  if (!lead.email?.trim() && !lead.whatsapp_phone?.trim()) missingFields.push("email ou WhatsApp");
  if (!lead.goal?.trim()) missingFields.push("objectif");
  if (!lead.professional_status?.trim()) missingFields.push("situation professionnelle");
  if (!lead.cpf_status?.trim()) missingFields.push("statut CPF");
  if (!lead.france_travail_registered?.trim()) missingFields.push("statut France Travail");

  return missingFields;
}

export const getPartnersAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    const { data: partners, error } = await supabaseAdmin
      .from("partners")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw new Error("Erreur de chargement des partenaires");

    // Fetch counts of lead transmissions
    const { data: transmissions } = await supabaseAdmin
      .from("partner_transmissions")
      .select("partner_id");

    const counts: Record<string, number> = {};
    for (const t of transmissions ?? []) {
      if (t.partner_id) {
        counts[t.partner_id] = (counts[t.partner_id] || 0) + 1;
      }
    }

    return (partners ?? []).map((p: any) => ({
      ...p,
      transmissions_count: counts[p.id] || 0
    }));
  });

export const createPartnerAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((input) => partnerSchema.parse(input))
  .handler(async ({ data }) => {
    const payload = {
      name: data.name,
      slug: data.slug.toLowerCase().trim(),
      contact_name: data.contactName,
      contact_email: data.contactEmail || null,
      contact_whatsapp: data.contactWhatsapp,
      status: data.status,
      service_types: data.serviceTypes,
      transmission_mode: data.transmissionMode,
      reception_email: data.receptionEmail || null,
      webhook_url: data.webhookUrl || null,
      legal_notes: data.legalNotes,
      kbis_verified: data.kbisVerified,
      insurance_verified: data.insuranceVerified,
      contract_signed: data.contractSigned,
      contract_signed_at: data.contractSigned ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: res, error } = await supabaseAdmin
      .from("partners")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw new Error(`Erreur lors de la création : ${error.message}`);
    return { ok: true, id: res.id };
  });

export const updatePartnerAdminFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((input) => z.object({ id: z.string().uuid(), partner: partnerSchema }).parse(input))
  .handler(async ({ data }) => {
    const payload = {
      name: data.partner.name,
      slug: data.partner.slug.toLowerCase().trim(),
      contact_name: data.partner.contactName,
      contact_email: data.partner.contactEmail || null,
      contact_whatsapp: data.partner.contactWhatsapp,
      status: data.partner.status,
      service_types: data.partner.serviceTypes,
      transmission_mode: data.partner.transmissionMode,
      reception_email: data.partner.receptionEmail || null,
      webhook_url: data.partner.webhookUrl || null,
      legal_notes: data.partner.legalNotes,
      kbis_verified: data.partner.kbisVerified,
      insurance_verified: data.partner.insuranceVerified,
      contract_signed: data.partner.contractSigned,
      contract_signed_at: data.partner.contractSigned ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("partners")
      .update(payload)
      .eq("id", data.id);

    if (error) throw new Error(`Erreur de modification : ${error.message}`);
    return { ok: true };
  });

export const assignPartnerManualFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) => z.object({
    leadId: z.string().uuid(),
    partnerId: z.string().uuid(),
    transmittedBy: z.string().uuid().optional(),
    notes: z.string().optional()
  }).parse(input))
  .handler(async ({ data }) => {
    // 1. Fetch Lead
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .maybeSingle();

    if (!lead) throw new Error("Lead introuvable");

    // 2. Fetch Partner
    const { data: partner } = await supabaseAdmin
      .from("partners")
      .select("*")
      .eq("id", data.partnerId)
      .maybeSingle();

    if (!partner) throw new Error("Partenaire introuvable");

    // 3. Register Transmission snapshot
    const transmissionPayload = {
      lead_id: data.leadId,
      partner_id: data.partnerId,
      transmission_mode: partner.transmission_mode || "manual_csv",
      transmitted_by: data.transmittedBy || null,
      status: "sent",
      transmitted_at: new Date().toISOString(),
      payload_snapshot: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        whatsapp_phone: lead.whatsapp_phone,
        estimated_level: lead.estimated_level,
        goal: lead.goal,
        partner_request_type: lead.partner_request_type,
        message: lead.message
      },
      consent_snapshot: {
        consent_training: lead.consent_training,
        consent_partner: lead.consent_partner,
        consent_timestamp: lead.consent_timestamp,
        consent_partner_version: lead.consent_partner_text_version
      },
      notes: data.notes || "Transmission manuelle d'administration"
    };

    const { error: txError } = await supabaseAdmin
      .from("partner_transmissions")
      .insert(transmissionPayload);

    if (txError) throw new Error(`Erreur d'historisation de la transmission: ${txError.message}`);

    // 4. Update Lead record status
    const { error: leadError } = await supabaseAdmin
      .from("leads")
      .update({
        partner_id: data.partnerId,
        partner_status: "transmitted",
        status: "converted_to_case",
        updated_at: new Date().toISOString()
      })
      .eq("id", data.leadId);

    if (leadError) throw new Error(`Erreur de mise à jour du prospect: ${leadError.message}`);

    // 5. Add custom event log
    await supabaseAdmin.from("lead_events").insert({
      lead_id: data.leadId,
      event_name: "lead_transmitted",
      properties: {
        partner_id: data.partnerId,
        partner_name: partner.name,
        transmission_mode: partner.transmission_mode
      }
    });

    return { ok: true };
  });

export const getReportingStatsFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("id, created_at, status, goal, source");

    if (error) throw new Error("Erreur de calcul analytique");

    const totalLeads = leads?.length || 0;
    const qualifiedLeads = leads?.filter((l) => ["qualified", "converted_to_case"].includes(l.status)).length || 0;
    const convertedLeads = leads?.filter((l) => l.status === "converted_to_case").length || 0;

    // Estimate CA Secured: assuming €1500 per qualified training file (goal has CPF value, etc.)
    // We count dossiers qualified and active in conversion
    const caSecured = qualifiedLeads * 1500;

    // Split by tunnel/source
    const tunnelStats = {
      directAdmin: leads?.filter((l) => l.source === "accompagnement_admin").length || 0,
      testRapide: leads?.filter((l) => l.source === "test_rapide").length || 0,
      testComplet: leads?.filter((l) => l.source === "test_complet").length || 0,
      other: leads?.filter((l) => !["accompagnement_admin", "test_rapide", "test_complet"].includes(l.source)).length || 0
    };

    // Prepare weekly trend coordinates (group by day)
    const dailyMap: Record<string, number> = {};
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const l of leads ?? []) {
      if (l.created_at) {
        const d = new Date(l.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
        dailyMap[d] = (dailyMap[d] || 0) + 1;
      }
    }

    const trends = Object.entries(dailyMap).map(([day, value]) => ({
      name: day,
      leads: value
    })).reverse().slice(0, 10);

    return {
      metrics: {
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        caSecured,
        averageConversionDays: 4 // Mock computed standard value
      },
      tunnel: tunnelStats,
      trends
    };
  });

export const getAdvisorsWorkloadFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    // 1. Fetch user roles to find advisors/admins
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) throw new Error("Erreur de chargement de l'équipe");

    // 2. Fetch leads distribution
    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("id, assigned_to, status");

    const workloadMap: Record<string, number> = {};
    for (const l of leads ?? []) {
      if (l.assigned_to) {
        workloadMap[l.assigned_to] = (workloadMap[l.assigned_to] || 0) + 1;
      }
    }

    // Regroup by user
    const advisors = (userRoles ?? []).map((u) => ({
      id: u.user_id,
      email: u.user_id.slice(0, 8) + "@bilanfrancais.fr", // Mock contact since auth listUsers is server-only
      role: u.role,
      activeDossiers: workloadMap[u.user_id] || 0
    }));

    return advisors;
  });

export const toggleUserRoleFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((input) => z.object({
    userId: z.string().uuid(),
    currentRole: z.enum(["admin", "gestionnaire", "conseiller", "inscrit"])
  }).parse(input))
  .handler(async ({ data, context }) => {
    const callerUserId = (context as { userId: string }).userId;

    if (data.userId === callerUserId) {
      throw new Error("Vous ne pouvez pas modifier votre propre rôle");
    }

    const nextRole = data.currentRole === "admin" ? "conseiller" : "admin";
    
    if (data.currentRole === "admin") {
      const { count, error: countError } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if (countError) throw new Error("Erreur de validation de la cohérence d'administration");
      if ((count ?? 0) < 2) {
        throw new Error("Il doit rester au moins un administrateur");
      }
    }

    // Check if role row exists
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("user_roles")
        .update({ role: nextRole })
        .eq("user_id", data.userId);
    } else {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: nextRole });
    }

    // Log the event
    await supabaseAdmin.from("lead_events").insert({
      lead_id: null,
      event_name: "user_role_changed",
      properties: {
        by: callerUserId,
        target: data.userId,
        from: data.currentRole,
        to: nextRole
      }
    });

    return { ok: true };
  });
