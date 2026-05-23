import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";

const supabaseAdmin: any = _supabaseAdmin;

async function getLeadByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id, prenom, email")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function getActiveEnrollment(leadId: string) {
  const { data, error } = await supabaseAdmin
    .from("cohort_enrollments")
    .select("*")
    .eq("lead_id", leadId)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function emailFromContext(context: any): string {
  const email = context?.claims?.email;
  if (!email) throw new Error("Email introuvable dans la session");
  return String(email);
}

// ---------- Ma cohorte ----------
export const getMyCohortFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = emailFromContext(context);
    const lead = await getLeadByEmail(email);
    if (!lead) return { lead: null, enrollment: null, cohort: null, journey: null, sessions: [], nextSession: null, pastCount: 0, totalCount: 0 };

    const enrollment = await getActiveEnrollment(lead.id);
    if (!enrollment) return { lead, enrollment: null, cohort: null, journey: null, sessions: [], nextSession: null, pastCount: 0, totalCount: 0 };

    const { data: cohort } = await supabaseAdmin
      .from("cohorts")
      .select("*, formation_journeys(id,title,level,duration_weeks,description)")
      .eq("id", enrollment.cohort_id)
      .single();

    const { data: sessions } = await supabaseAdmin
      .from("cohort_sessions")
      .select("*")
      .eq("cohort_id", enrollment.cohort_id)
      .order("session_number", { ascending: true });

    const today = new Date().toISOString().slice(0, 10);
    const allSessions = sessions || [];
    const upcoming = allSessions.filter((s: any) => s.session_date >= today);
    const past = allSessions.filter((s: any) => s.session_date < today);
    const nextSession = upcoming[0] || null;

    return {
      lead,
      enrollment,
      cohort,
      journey: cohort?.formation_journeys || null,
      sessions: allSessions,
      nextSession,
      pastCount: past.length,
      totalCount: allSessions.length,
    };
  });

// ---------- Mes séances ----------
export const getMySessionsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = emailFromContext(context);
    const lead = await getLeadByEmail(email);
    if (!lead) return { lead: null, cohort: null, journey: null, sessions: [], attendanceByS: {} };

    const enrollment = await getActiveEnrollment(lead.id);
    if (!enrollment) return { lead, cohort: null, journey: null, sessions: [], attendanceByS: {} };

    const { data: cohort } = await supabaseAdmin
      .from("cohorts")
      .select("*, formation_journeys(id,title,level)")
      .eq("id", enrollment.cohort_id)
      .single();

    const { data: sessions } = await supabaseAdmin
      .from("cohort_sessions")
      .select("*")
      .eq("cohort_id", enrollment.cohort_id)
      .order("session_number", { ascending: true });

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("lead_id", lead.id);

    const attendanceByS: Record<string, any> = {};
    for (const a of attendance || []) attendanceByS[a.session_id] = a;

    return {
      lead,
      cohort,
      journey: cohort?.formation_journeys || null,
      sessions: sessions || [],
      attendanceByS,
    };
  });

// ---------- Émargement: get details ----------
export const getEmargementContextFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const email = emailFromContext(context);
    const lead = await getLeadByEmail(email);
    if (!lead) return { ok: false as const, reason: "no_lead" };

    const { data: session } = await supabaseAdmin
      .from("cohort_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) return { ok: false as const, reason: "no_session" };

    // verify cohort belongs to lead
    const { data: enr } = await supabaseAdmin
      .from("cohort_enrollments")
      .select("id")
      .eq("lead_id", lead.id)
      .eq("cohort_id", session.cohort_id)
      .maybeSingle();
    if (!enr) return { ok: false as const, reason: "not_enrolled" };

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("session_id", data.sessionId)
      .eq("lead_id", lead.id)
      .maybeSingle();

    if (!attendance) return { ok: false as const, reason: "no_attendance", session };
    return { ok: true as const, session, attendance };
  });

// ---------- Émargement: submit ----------
export const submitEmargementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      sessionId: z.string().uuid(),
      mode: z.enum(["click", "code", "absent"]),
      code: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const email = emailFromContext(context);
    const lead = await getLeadByEmail(email);
    if (!lead) throw new Error("Lead introuvable");

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("session_id", data.sessionId)
      .eq("lead_id", lead.id)
      .maybeSingle();
    if (!attendance) throw new Error("Vous n'êtes pas attendu(e) à cette séance");
    if (attendance.signed_at) throw new Error("Vous avez déjà émargé cette séance");

    const patch: any = {
      signed_at: new Date().toISOString(),
    };
    if (data.mode === "absent") {
      patch.status = "absent";
      patch.notes = data.notes || null;
      patch.signature_method = "self_declared";
    } else {
      patch.status = "present";
      patch.signature_method = data.mode === "code" ? "code_4_digits" : "click_validation";
    }

    const { error } = await supabaseAdmin
      .from("attendance")
      .update(patch)
      .eq("id", attendance.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Mes documents ----------
export const getMyDocumentsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = emailFromContext(context);
    const lead = await getLeadByEmail(email);
    if (!lead) return { lead: null, cohort: null, journey: null, documents: [] };

    const enrollment = await getActiveEnrollment(lead.id);
    if (!enrollment) return { lead, cohort: null, journey: null, documents: [] };

    const { data: cohort } = await supabaseAdmin
      .from("cohorts")
      .select("*, formation_journeys(id,title,level,description)")
      .eq("id", enrollment.cohort_id)
      .single();

    const today = new Date().toISOString().slice(0, 10);
    const { data: sessions } = await supabaseAdmin
      .from("cohort_sessions")
      .select("id, session_number, session_date, title, documents")
      .eq("cohort_id", enrollment.cohort_id)
      .lte("session_date", today)
      .order("session_date", { ascending: false });

    const documents: Array<{
      sessionNumber: number;
      sessionDate: string;
      sessionTitle: string | null;
      name: string;
      url?: string;
      type?: string;
    }> = [];
    for (const s of sessions || []) {
      const docs = Array.isArray(s.documents) ? s.documents : [];
      for (const d of docs) {
        documents.push({
          sessionNumber: s.session_number,
          sessionDate: s.session_date,
          sessionTitle: s.title ?? null,
          name: d.name || d.title || "Document",
          url: d.url,
          type: d.type,
        });
      }
    }

    return {
      lead,
      cohort,
      journey: cohort?.formation_journeys || null,
      documents,
    };
  });
