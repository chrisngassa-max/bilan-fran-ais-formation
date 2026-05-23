import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireRole } from "@/integrations/supabase/require-role";

const supabaseAdmin: any = _supabaseAdmin;

const slotSchema = z.object({
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const createCohortSchema = z.object({
  formation_journey_id: z.string().uuid(),
  intensity: z.enum(["standard", "intensif", "express"]),
  visibility: z.enum(["private", "public"]),
  meeting_url: z.string().url().optional().or(z.literal("")),
  start_date: z.string(),
  weekly_schedule: z.array(slotSchema).min(1).max(3),
  max_students: z.number().int().min(2).max(20),
  min_students_to_confirm: z.number().int().min(2),
});

// ---------- List ----------
export const listCohortsFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) =>
    z.object({
      status: z.string().optional(),
      intensity: z.string().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const userRoles = ((context as any).userRoles ?? []) as string[];
    const isAdmin = userRoles.includes("admin");

    let q = supabaseAdmin
      .from("cohorts")
      .select("*, formation_journeys(id,title,level)")
      .order("start_date", { ascending: false });

    // Gestionnaire (non-admin) ne voit que ses propres cohortes
    if (!isAdmin) q = q.eq("formateur_id", userId);

    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.intensity && data.intensity !== "all") q = q.eq("intensity", data.intensity);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Compute enrolled count per cohort
    const out = await Promise.all(
      (rows || []).map(async (c: any) => {
        const { count } = await supabaseAdmin
          .from("cohort_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("cohort_id", c.id)
          .in("status", ["confirmed", "pending"]);
        return { ...c, enrolled_count: count || 0 };
      }),
    );
    return { cohorts: out };
  });

// ---------- Get journeys ----------
export const listJourneysFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("formation_journeys")
      .select("*")
      .order("title");
    if (error) throw new Error(error.message);
    return { journeys: data || [] };
  });

// ---------- Get one ----------
export const getCohortFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) => z.object({ cohortId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const userId = (context as any).userId as string;
    const userRoles = ((context as any).userRoles ?? []) as string[];
    const isAdmin = userRoles.includes("admin");

    const { data: cohort, error } = await supabaseAdmin
      .from("cohorts")
      .select("*, formation_journeys(id,title,level,duration_weeks,price_euros)")
      .eq("id", data.cohortId)
      .single();
    if (error) throw new Error(error.message);

    // Gestionnaire (non-admin) ne peut accéder qu'à ses propres cohortes
    if (!isAdmin && cohort.formateur_id !== userId) {
      throw new Error("Accès refusé à cette cohorte");
    }

    const { data: sessions } = await supabaseAdmin
      .from("cohort_sessions")
      .select("*")
      .eq("cohort_id", data.cohortId)
      .order("session_number");

    const { data: enrollments } = await supabaseAdmin
      .from("cohort_enrollments")
      .select("*, leads(id,first_name,email)")
      .eq("cohort_id", data.cohortId)
      .order("created_at", { ascending: false });

    return {
      cohort,
      sessions: sessions || [],
      enrollments: enrollments || [],
    };
  });

// ---------- Update status ----------
export const updateCohortStatusFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) =>
    z.object({
      cohortId: z.string().uuid(),
      status: z.enum(["draft", "open", "confirming", "confirmed", "in_progress", "completed", "cancelled"]),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("cohorts")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.cohortId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Update session ----------
export const updateCohortSessionFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) =>
    z.object({
      sessionId: z.string().uuid(),
      session_date: z.string().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      meeting_url: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { sessionId, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("cohort_sessions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Enroll by email ----------
export const enrollLeadFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) =>
    z.object({
      cohortId: z.string().uuid(),
      email: z.string().email(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: lead, error: e1 } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!lead) throw new Error("Aucun lead trouvé avec cet email");

    const { error } = await supabaseAdmin
      .from("cohort_enrollments")
      .insert({ cohort_id: data.cohortId, lead_id: lead.id, status: "pending" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Create cohort + sessions ----------
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const INTENSITY_HOURS: Record<string, number> = { standard: 3, intensif: 6, express: 9 };
const INTENSITY_CODE: Record<string, string> = { standard: "STD", intensif: "INT", express: "EXP" };

export const createCohortFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin", "gestionnaire"])])
  .inputValidator((input) => createCohortSchema.parse(input))
  .handler(async ({ data }) => {
    // Fetch journey for level + duration
    const { data: journey, error: jErr } = await supabaseAdmin
      .from("formation_journeys")
      .select("*")
      .eq("id", data.formation_journey_id)
      .single();
    if (jErr || !journey) throw new Error("Parcours introuvable");

    const durationWeeks = journey.duration_weeks || 12;
    const hoursPerWeek = INTENSITY_HOURS[data.intensity];
    const sessionsPerWeek = data.weekly_schedule.length;
    const totalSessions = Math.ceil((durationWeeks * 3) / hoursPerWeek * sessionsPerWeek / sessionsPerWeek)
      || durationWeeks * sessionsPerWeek;
    // Simpler: total sessions = weeks needed * sessionsPerWeek
    const weeksNeeded = Math.ceil((durationWeeks * 3) / hoursPerWeek);
    const totalSessionsCalc = weeksNeeded * sessionsPerWeek;

    const startDate = new Date(data.start_date);
    const week = isoWeek(startDate);
    const year = startDate.getFullYear();
    const level = (journey.level || "B1").toUpperCase();
    const code = `${level}-${INTENSITY_CODE[data.intensity]}-${year}-S${String(week).padStart(2, "0")}`;

    // Estimated end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeksNeeded * 7);

    // Exam blanc milestones
    const eb1 = Math.floor(totalSessionsCalc * 0.5);
    const eb2 = Math.floor(totalSessionsCalc * 0.75);
    const eb3 = totalSessionsCalc;

    const { data: created, error } = await supabaseAdmin
      .from("cohorts")
      .insert({
        formation_journey_id: data.formation_journey_id,
        intensity: data.intensity,
        visibility: data.visibility,
        meeting_url: data.meeting_url || null,
        start_date: data.start_date,
        estimated_end_date: endDate.toISOString().slice(0, 10),
        weekly_schedule: data.weekly_schedule,
        total_sessions: totalSessionsCalc,
        max_students: data.max_students,
        min_students_to_confirm: data.min_students_to_confirm,
        status: "draft",
        code,
        exam_blank_1_session: eb1,
        exam_blank_2_session: eb2,
        exam_blank_3_session: eb3,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Generate sessions
    const sessions: any[] = [];
    let sessionNumber = 1;
    const cursor = new Date(startDate);
    for (let w = 0; w < weeksNeeded && sessionNumber <= totalSessionsCalc; w++) {
      const weekStart = new Date(cursor);
      weekStart.setDate(weekStart.getDate() + w * 7);
      // Snap to Monday
      const dow = weekStart.getDay() || 7;
      weekStart.setDate(weekStart.getDate() - (dow - 1));

      const sortedSlots = [...data.weekly_schedule].sort((a, b) =>
        a.day - b.day || a.start.localeCompare(b.start),
      );
      for (const slot of sortedSlots) {
        if (sessionNumber > totalSessionsCalc) break;
        const sessionDate = new Date(weekStart);
        sessionDate.setDate(sessionDate.getDate() + slot.day);
        if (sessionDate < startDate) continue;

        const [sh, sm] = slot.start.split(":").map(Number);
        const [eh, em] = slot.end.split(":").map(Number);
        const dur = (eh * 60 + em) - (sh * 60 + sm);

        let type = "cours";
        if (sessionNumber === eb1) type = "exam_blanc";
        else if (sessionNumber === eb2) type = "exam_blanc";
        else if (sessionNumber === eb3) type = "exam_blanc";

        sessions.push({
          cohort_id: created.id,
          session_number: sessionNumber,
          session_date: sessionDate.toISOString().slice(0, 10),
          start_time: slot.start,
          end_time: slot.end,
          duration_minutes: dur,
          session_type: type,
          format: "visio",
          meeting_url: data.meeting_url || null,
          status: "scheduled",
        });
        sessionNumber++;
      }
    }

    if (sessions.length > 0) {
      const { error: sErr } = await supabaseAdmin.from("cohort_sessions").insert(sessions);
      if (sErr) throw new Error(sErr.message);
    }

    return { cohort: created };
  });
