import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireRole } from "@/integrations/supabase/require-role";

const supabaseAdmin: any = _supabaseAdmin;

// ---------- Mes séances (par plage) ----------
export const getMesSeancesFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["gestionnaire", "admin"])])
  .inputValidator((input) =>
    z
      .object({
        from: z.string().optional(),
        to: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const userRoles = (context as any).userRoles as string[];
    const isAdmin = userRoles?.includes("admin");

    let cohortQ = supabaseAdmin
      .from("cohorts")
      .select("id, code, formation_journeys(title)");
    if (!isAdmin) cohortQ = cohortQ.eq("formateur_id", userId);
    const { data: cohorts, error: cErr } = await cohortQ;
    if (cErr) throw new Error(cErr.message);

    const cohortIds = (cohorts ?? []).map((c: any) => c.id);
    if (cohortIds.length === 0) return { sessions: [] };

    let q = supabaseAdmin
      .from("cohort_sessions")
      .select("*")
      .in("cohort_id", cohortIds)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (data.from) q = q.gte("session_date", data.from);
    if (data.to) q = q.lte("session_date", data.to);

    const { data: sessions, error } = await q;
    if (error) throw new Error(error.message);

    const cohortMap = new Map((cohorts ?? []).map((c: any) => [c.id, c]));

    const enriched = await Promise.all(
      (sessions ?? []).map(async (s: any) => {
        const { count } = await supabaseAdmin
          .from("cohort_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("cohort_id", s.cohort_id)
          .in("status", ["confirmed", "pending"]);
        const cohort: any = cohortMap.get(s.cohort_id);
        return {
          ...s,
          cohort_code: cohort?.code ?? "—",
          journey_title: cohort?.formation_journeys?.title ?? "",
          nb_apprenants: count ?? 0,
        };
      }),
    );

    return { sessions: enriched };
  });

// ---------- Détail séance avec liste apprenants ----------
export const getSessionDetailFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["gestionnaire", "admin"])])
  .inputValidator((input) =>
    z.object({ sessionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const userRoles = (context as any).userRoles as string[];
    const isAdmin = userRoles?.includes("admin");

    const { data: session, error } = await supabaseAdmin
      .from("cohort_sessions")
      .select("*")
      .eq("id", data.sessionId)
      .single();
    if (error) throw new Error(error.message);

    const { data: cohort } = await supabaseAdmin
      .from("cohorts")
      .select("id, code, formateur_id, formation_journeys(title)")
      .eq("id", session.cohort_id)
      .single();

    if (!isAdmin && cohort.formateur_id !== userId) {
      throw new Error("Accès refusé à cette séance");
    }

    const { data: enrollments } = await supabaseAdmin
      .from("cohort_enrollments")
      .select("lead_id")
      .eq("cohort_id", session.cohort_id)
      .in("status", ["confirmed", "pending"]);

    const leadIds = (enrollments ?? []).map((e: any) => e.lead_id);

    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("session_id", data.sessionId);

    const { data: leads } = leadIds.length
      ? await supabaseAdmin
          .from("leads")
          .select("id, first_name, email")
          .in("id", leadIds)
      : { data: [] };

    const leadMap = new Map((leads ?? []).map((l: any) => [l.id, l]));
    const attMap = new Map((attendance ?? []).map((a: any) => [a.lead_id, a]));

    const apprenants = leadIds.map((lid: string) => {
      const lead: any = leadMap.get(lid);
      const att: any = attMap.get(lid);
      return {
        lead_id: lid,
        prenom: lead?.first_name ?? "",
        email: lead?.email ?? "",
        attendance_id: att?.id ?? null,
        status: att?.status ?? "pending",
        signed_at: att?.signed_at ?? null,
      };
    });

    return {
      session,
      cohort: {
        id: cohort.id,
        code: cohort.code,
        title: cohort.formation_journeys?.title ?? "",
      },
      apprenants,
    };
  });

// ---------- Marquer présence ----------
export const marquerPresenceFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["gestionnaire", "admin"])])
  .inputValidator((input) =>
    z
      .object({
        sessionId: z.string().uuid(),
        leadId: z.string().uuid(),
        status: z.enum(["present", "absent", "pending"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const userRoles = (context as any).userRoles as string[];
    const isAdmin = userRoles?.includes("admin");

    // Verify session belongs to formateur (admin sera vérifié par RLS aussi)
    const { data: session } = await supabaseAdmin
      .from("cohort_sessions")
      .select("cohort_id")
      .eq("id", data.sessionId)
      .single();
    if (!session) throw new Error("Séance introuvable");

    const { data: coh } = await supabaseAdmin
      .from("cohorts")
      .select("formateur_id")
      .eq("id", session.cohort_id)
      .single();
    if (!isAdmin && coh?.formateur_id !== userId) {
      throw new Error("Accès refusé");
    }


    const { data: existing } = await supabaseAdmin
      .from("attendance")
      .select("id")
      .eq("session_id", data.sessionId)
      .eq("lead_id", data.leadId)
      .maybeSingle();

    const payload: any = {
      session_id: data.sessionId,
      lead_id: data.leadId,
      status: data.status,
      marked_by: userId,
      signed_at: data.status === "present" ? new Date().toISOString() : null,
      signature_method: data.status === "present" ? "formateur" : null,
    };

    if (existing) {
      const { error } = await supabaseAdmin
        .from("attendance")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("attendance").insert(payload);
      if (error) throw new Error(error.message);
    }

    return { success: true };
  });

// ---------- Mes apprenants ----------
export const getMesApprenantsFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["gestionnaire", "admin"])])
  .handler(async ({ context }) => {
    const userId = (context as any).userId as string;
    const userRoles = (context as any).userRoles as string[];
    const isAdmin = userRoles?.includes("admin");

    let cohortQ = supabaseAdmin.from("cohorts").select("id, code");
    if (!isAdmin) cohortQ = cohortQ.eq("formateur_id", userId);
    const { data: cohorts } = await cohortQ;
    const cohortIds = (cohorts ?? []).map((c: any) => c.id);
    if (cohortIds.length === 0) return { apprenants: [] };

    const { data: enrollments } = await supabaseAdmin
      .from("cohort_enrollments")
      .select("id, status, payment_mode, cohort_id, lead_id")
      .in("cohort_id", cohortIds);

    if (!enrollments?.length) return { apprenants: [] };

    const leadIds = enrollments.map((e: any) => e.lead_id);
    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("id, first_name, email, whatsapp_phone, estimated_level")
      .in("id", leadIds);

    const cohortMap = new Map((cohorts ?? []).map((c: any) => [c.id, c]));
    const leadMap = new Map((leads ?? []).map((l: any) => [l.id, l]));

    const today = new Date().toISOString().slice(0, 10);

    const apprenants = await Promise.all(
      enrollments.map(async (e: any) => {
        const { data: sessions } = await supabaseAdmin
          .from("cohort_sessions")
          .select("id, session_date")
          .eq("cohort_id", e.cohort_id);

        const pastSessionIds = (sessions ?? [])
          .filter((s: any) => s.session_date <= today)
          .map((s: any) => s.id);

        let nb_present = 0;
        if (pastSessionIds.length) {
          const { count } = await supabaseAdmin
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .eq("lead_id", e.lead_id)
            .eq("status", "present")
            .in("session_id", pastSessionIds);
          nb_present = count ?? 0;
        }

        const lead: any = leadMap.get(e.lead_id);
        const cohort: any = cohortMap.get(e.cohort_id);
        const seances_passees = pastSessionIds.length;
        const taux =
          seances_passees > 0 ? Math.round((nb_present / seances_passees) * 100) : null;

        return {
          enrollment_id: e.id,
          status: e.status,
          payment_mode: e.payment_mode,
          prenom: lead?.first_name ?? "",
          email: lead?.email ?? "",
          whatsapp_phone: lead?.whatsapp_phone ?? "",
          estimated_level: lead?.estimated_level ?? "",
          cohort_code: cohort?.code ?? "",
          seances_presentes: nb_present,
          seances_passees,
          taux_presence: taux,
        };
      }),
    );

    return { apprenants };
  });
