import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireRole } from "@/integrations/supabase/require-role";

const supabaseAdmin: any = _supabaseAdmin;

function startOfMonthISO(offsetMonths = 0): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() + offsetMonths);
  return d.toISOString();
}

// ---------- Dashboard stats ----------
export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    const startThisMonth = startOfMonthISO(0);
    const startLastMonth = startOfMonthISO(-1);
    const endLastMonth = startThisMonth;
    const today = new Date().toISOString().slice(0, 10);
    const in7Days = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);

    const SOURCES = ["accompagnement_admin", "test_rapide", "test_complet", "session_directe"];

    const [
      thisMonth,
      lastMonth,
      sourceCounts,
      activeCohorts,
      activeEnrollments,
      partnerRequests,
      upcomingSessions,
    ] = await Promise.all([
      supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startThisMonth),
      supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startLastMonth)
        .lt("created_at", endLastMonth),
      Promise.all(
        SOURCES.map((s) =>
          supabaseAdmin
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("source", s)
            .gte("created_at", startThisMonth)
            .then((r: any) => ({ source: s, count: r.count || 0 })),
        ),
      ),
      supabaseAdmin
        .from("cohorts")
        .select("*")
        .in("status", ["open", "confirming", "confirmed", "in_progress"])
        .order("start_date", { ascending: true }),
      supabaseAdmin
        .from("cohort_enrollments")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"]),
      supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("partner_status", "partner_requested_but_unassigned"),
      supabaseAdmin
        .from("cohort_sessions")
        .select("*, cohorts(id,code)")
        .gte("session_date", today)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5),
    ]);

    // Compute enrolled counts per active cohort
    const cohorts = activeCohorts.data || [];
    const withCounts = await Promise.all(
      cohorts.map(async (c: any) => {
        const { count } = await supabaseAdmin
          .from("cohort_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("cohort_id", c.id)
          .in("status", ["pending", "confirmed"]);
        return { ...c, enrolled_count: count || 0 };
      }),
    );

    const dangerCohorts = withCounts.filter(
      (c: any) =>
        c.enrolled_count < (c.min_students_to_confirm ?? 3) &&
        c.start_date < in7Days &&
        !["confirmed", "in_progress", "completed"].includes(c.status),
    );

    // Fill rate of open/confirming cohorts
    const fillCohorts = withCounts.filter((c: any) =>
      ["open", "confirming"].includes(c.status),
    );
    const fillRate =
      fillCohorts.length > 0
        ? Math.round(
            (fillCohorts.reduce(
              (sum: number, c: any) => sum + c.enrolled_count / Math.max(1, c.max_students),
              0,
            ) /
              fillCohorts.length) *
              100,
          )
        : 0;

    // Attendees per upcoming session
    const sessionsOut = await Promise.all(
      (upcomingSessions.data || []).map(async (s: any) => {
        const { count } = await supabaseAdmin
          .from("cohort_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("cohort_id", s.cohort_id)
          .in("status", ["pending", "confirmed"]);
        return { ...s, attendees: count || 0 };
      }),
    );

    return {
      leadsThisMonth: thisMonth.count || 0,
      leadsLastMonth: lastMonth.count || 0,
      leadsBySource: sourceCounts as Array<{ source: string; count: number }>,
      activeCohorts: withCounts,
      activeEnrollments: activeEnrollments.count || 0,
      dangerCohorts,
      partnerRequestsCount: partnerRequests.count || 0,
      fillRate,
      upcomingSessions: sessionsOut,
    };
  });

// ---------- Apprenants list ----------
export const getApprenantsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("cohort_enrollments")
      .select(
        `id, status, payment_mode, stafy_status, total_paid, reserved_at, confirmed_at,
         leads:lead_id(id, first_name, prenom, email, whatsapp_phone, estimated_level),
         cohorts:cohort_id(id, code, start_date, status,
           formation_journeys:formation_journey_id(id, title))`,
      )
      .order("reserved_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (data || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      payment_mode: r.payment_mode,
      stafy_status: r.stafy_status,
      total_paid: r.total_paid,
      reserved_at: r.reserved_at,
      confirmed_at: r.confirmed_at,
      lead_id: r.leads?.id ?? null,
      first_name: r.leads?.first_name ?? r.leads?.prenom ?? null,
      email: r.leads?.email ?? null,
      whatsapp_phone: r.leads?.whatsapp_phone ?? null,
      estimated_level: r.leads?.estimated_level ?? null,
      cohort_id: r.cohorts?.id ?? null,
      cohort_code: r.cohorts?.code ?? null,
      cohort_start_date: r.cohorts?.start_date ?? null,
      cohort_status: r.cohorts?.status ?? null,
      journey_name: r.cohorts?.formation_journeys?.title ?? null,
    }));

    // Distinct cohorts list for filter
    const cohortMap = new Map<string, { id: string; code: string; title: string | null }>();
    for (const r of rows) {
      if (r.cohort_id && !cohortMap.has(r.cohort_id)) {
        cohortMap.set(r.cohort_id, {
          id: r.cohort_id,
          code: r.cohort_code || r.cohort_id.slice(0, 8),
          title: r.journey_name,
        });
      }
    }

    return { rows, cohorts: Array.from(cohortMap.values()) };
  });

// ---------- Public: send confirmation email after enrollment ----------
export const sendEnrollmentConfirmationFn = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      cohort_id: z.string().uuid(),
      lead_id: z.string().uuid(),
      is_waiting_list: z.boolean(),
      payment_mode: z.string().nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    // Look up details server-side (don't trust client)
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("email, first_name, prenom")
      .eq("id", data.lead_id)
      .maybeSingle();
    if (!lead?.email) return { ok: false, reason: "no_email" };

    const { data: cohort } = await supabaseAdmin
      .from("cohorts")
      .select("code, start_date, weekly_schedule, meeting_url, formation_journeys(title)")
      .eq("id", data.cohort_id)
      .maybeSingle();
    if (!cohort) return { ok: false, reason: "no_cohort" };

    const { envoyerEmailConfirmationReservation } = await import("@/utils/email-cohortes");

    const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const schedule = Array.isArray(cohort.weekly_schedule) ? cohort.weekly_schedule : [];
    const weekly_schedule_text = schedule
      .map((s: any) => `${DAYS[s.day] || ""} ${s.start?.slice(0, 5)}-${s.end?.slice(0, 5)}`)
      .join(" · ");

    const startFr = cohort.start_date
      ? new Date(cohort.start_date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    try {
      await envoyerEmailConfirmationReservation({
        email: lead.email,
        first_name: (lead.first_name || lead.prenom || "").toString(),
        cohort_code: cohort.code || "",
        journey_name: (cohort as any).formation_journeys?.title || "Parcours",
        start_date: startFr,
        weekly_schedule_text,
        meeting_url: cohort.meeting_url || undefined,
        payment_mode: data.payment_mode || "non précisé",
        is_waiting_list: data.is_waiting_list,
      });
      return { ok: true };
    } catch (e) {
      console.error("[sendEnrollmentConfirmation] failed", e);
      return { ok: false, reason: "send_failed" };
    }
  });
