import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useServerFn } from "@tanstack/react-start";
import { sendEnrollmentConfirmationFn } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/sessions/$cohortId")({
  head: () => ({
    meta: [
      { title: "Réserver ma place — Bilan Français Formation" },
      {
        name: "description",
        content:
          "Réservez votre place dans une session de formation au français. Groupes limités à 6 élèves.",
      },
    ],
  }),
  component: SessionDetailPage,
});

type Cohort = {
  id: string;
  code: string | null;
  intensity: string;
  status: string;
  start_date: string;
  estimated_end_date: string | null;
  max_students: number;
  min_students_to_confirm: number;
  weekly_schedule: any;
  total_sessions: number | null;
  meeting_url: string | null;
  formation_journey_id: string | null;
  formation_journeys: {
    title: string;
    description: string | null;
    duration_weeks: number | null;
    level: string | null;
  } | null;
};

const INTENSITY: Record<string, { label: string; cls: string }> = {
  standard: { label: "Standard", cls: "bg-slate-100 text-slate-700" },
  intensif: { label: "Intensif", cls: "bg-amber-100 text-amber-800" },
  express: { label: "Express ⚡", cls: "bg-red-100 text-red-800" },
};

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSchedule(weekly: any): string {
  if (!Array.isArray(weekly) || weekly.length === 0) return "Horaires à confirmer";
  return weekly
    .map((s: any) => {
      const day = (s.day || s.jour || "").toString();
      const time = s.start || s.start_time || s.heure || "";
      return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${time}`.trim();
    })
    .join(" + ");
}

function SessionDetailPage() {
  const { cohortId } = useParams({ from: "/sessions/$cohortId" });
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [enrolled, setEnrolled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("cohorts")
          .select(
            "id, code, intensity, status, start_date, estimated_end_date, max_students, min_students_to_confirm, weekly_schedule, total_sessions, meeting_url, formation_journey_id, formation_journeys(title, description, duration_weeks, level)"
          )
          .eq("id", cohortId)
          .eq("visibility", "public")
          .in("status", ["open", "confirming", "confirmed"])
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Session introuvable ou non disponible.");
        const { data: cnt } = await supabase.rpc("get_cohort_enrolled_count", {
          p_cohort_id: cohortId,
        });
        if (!cancelled) {
          setCohort(data as any);
          setEnrolled((cnt as number) ?? 0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cohortId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="font-bold text-slate-700">Chargement de la session…</p>
      </div>
    );
  }
  if (error || !cohort) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 p-8 rounded-2xl border border-red-200 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold mb-4">
            {error || "Session introuvable."}
          </p>
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-lg font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Voir toutes les sessions
          </Link>
        </div>
      </div>
    );
  }

  const intensityBadge = INTENSITY[cohort.intensity] || INTENSITY.standard;
  const remaining = Math.max(0, cohort.max_students - enrolled);
  const isFull = remaining === 0;
  const progressPct = Math.min(
    100,
    Math.round((enrolled / Math.max(1, cohort.max_students)) * 100)
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-[900px] mx-auto space-y-8">
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Toutes les sessions
        </Link>

        {/* SECTION 1 — En-tête */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${intensityBadge.cls}`}
            >
              {intensityBadge.label}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold capitalize">
              {cohort.status}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">
            {cohort.formation_journeys?.title || "Parcours de formation"}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <Info label="Démarrage" value={formatDateLong(cohort.start_date)} icon={<Calendar className="h-4 w-4" />} />
            <Info label="Créneaux" value={formatSchedule(cohort.weekly_schedule)} icon={<Clock className="h-4 w-4" />} />
            <Info
              label="Durée"
              value={
                cohort.formation_journeys?.duration_weeks
                  ? `${cohort.formation_journeys.duration_weeks} semaines`
                  : "—"
              }
              icon={<Clock className="h-4 w-4" />}
            />
            <Info
              label="Séances"
              value={cohort.total_sessions ? `${cohort.total_sessions} séances` : "—"}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {enrolled} / {cohort.max_students} inscrits
              </span>
              <span>{isFull ? "Complet" : `${remaining} places restantes`}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* SECTION 2 — Programme */}
        <Accordion title="Ce que vous allez préparer">
          <p className="text-slate-700 leading-relaxed">
            {cohort.formation_journeys?.description ||
              "Une formation structurée pour atteindre votre objectif administratif ou professionnel."}
          </p>
        </Accordion>

        <Accordion title="Structure du parcours">
          <ul className="space-y-2 text-slate-700">
            <li>📚 Séances de 3h en groupe restreint (6 élèves maximum)</li>
            <li>📝 3 examens blancs aux jalons 50%, 75% et 100%</li>
            <li>👩‍🏫 Un formateur référent tout au long du parcours</li>
            <li>💬 Suivi WhatsApp entre les séances</li>
          </ul>
        </Accordion>

        <Accordion title="Financement possible">
          <p className="text-slate-700">
            CPF · OPCO · France Travail · paiement en 3× sans frais
          </p>
          <Link
            to="/financement"
            className="inline-flex items-center gap-2 text-primary font-bold mt-3 hover:underline"
          >
            Vérifier mes droits au financement →
          </Link>
        </Accordion>

        {/* SECTION 3 — Réservation */}
        <ReservationForm cohortId={cohort.id} isFull={isFull} />
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        {icon} {label}
      </span>
      <p className="font-bold text-slate-800 text-sm mt-1">{value}</p>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-900"
      >
        {title}
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function ReservationForm({ cohortId, isFull }: { cohortId: string; isFull: boolean }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [paymentMode, setPaymentMode] = useState("direct");
  const [consentTraining, setConsentTraining] = useState(false);
  const [consentPartner, setConsentPartner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | "ok" | "waiting">(null);
  const [formError, setFormError] = useState<string | null>(null);
  const sendConfirmation = useServerFn(sendEnrollmentConfirmationFn);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Adresse email invalide.");
      return;
    }
    if (!consentTraining) {
      setFormError("Vous devez accepter de recevoir les informations sur la formation.");
      return;
    }
    setSubmitting(true);
    try {
      const emailLower = email.trim().toLowerCase();
      // 1) Trouver ou créer le lead
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("email", emailLower)
        .maybeSingle();

      let leadId: string;
      if (existing?.id) {
        leadId = existing.id;
      } else {
        const fullName = nom.trim() ? `${prenom.trim()} ${nom.trim()}` : prenom.trim();
        const { data: inserted, error: insertErr } = await supabase
          .from("leads")
          .insert({
            email: emailLower,
            first_name: fullName,
            whatsapp_phone: whatsapp || null,
            source: "session_directe",
            tunnel: "T0_inscription_directe",
            lead_intent: "training",
            consent_training: consentTraining,
            consent_partner: consentPartner,
            consent_at: new Date().toISOString(),
            whatsapp_consent: !!whatsapp,
            status: "new",
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        leadId = inserted.id;
      }

      // 2) Vérifier doublon d'inscription
      const { data: dup } = await supabase
        .from("cohort_enrollments")
        .select("id")
        .eq("cohort_id", cohortId)
        .eq("lead_id", leadId)
        .maybeSingle();
      if (dup) {
        setFormError("Vous êtes déjà inscrit(e) à cette session.");
        setSubmitting(false);
        return;
      }

      // 3) Insérer l'inscription
      const enrollStatus = isFull ? "waiting_list" : "pending";
      const { error: enrollErr } = await supabase.from("cohort_enrollments").insert({
        cohort_id: cohortId,
        lead_id: leadId,
        status: enrollStatus,
        payment_mode: paymentMode,
        reserved_at: new Date().toISOString(),
      });
      if (enrollErr) throw enrollErr;

      // 4) Créer les entrées d'émargement pour chaque séance
      const { data: sessions } = await supabase
        .from("cohort_sessions")
        .select("id")
        .eq("cohort_id", cohortId);

      if (sessions && sessions.length > 0) {
        const attendanceRows = sessions.map((s) => ({
          session_id: s.id,
          lead_id: leadId,
          status: "pending",
        }));
        const { error: attendErr } = await supabase
          .from("attendance")
          .upsert(attendanceRows, { onConflict: "session_id,lead_id", ignoreDuplicates: true });
        if (attendErr) {
          console.error("Attendance insert error (non bloquant):", attendErr);
        }
      }

      // Fire-and-forget confirmation email (non-blocking)
      sendConfirmation({
        data: {
          cohort_id: cohortId,
          lead_id: leadId,
          is_waiting_list: isFull,
          payment_mode: paymentMode,
        },
      }).catch((err) => console.error("[sendConfirmation] failed", err));

      setSuccess(isFull ? "waiting" : "ok");
    } catch (e: any) {
      setFormError(
        e?.message
          ? `Une erreur est survenue : ${e.message}`
          : "Une erreur est survenue. Réessayez ou contactez-nous."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
        <h2 className="text-2xl font-black text-emerald-900">
          {success === "ok" ? "Votre place est réservée !" : "Inscription en liste d'attente"}
        </h2>
        <p className="text-emerald-800">
          {success === "ok"
            ? "Vous recevrez une confirmation par email sous 24h."
            : "Vous êtes inscrit(e) en liste d'attente. Nous vous contacterons dès qu'une place se libère."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5"
    >
      <h2 className="text-2xl font-black text-slate-900">
        {isFull ? "S'inscrire en liste d'attente" : "Réserver ma place"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Prénom *">
          <input
            type="text"
            required
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5"
          />
        </Field>
        <Field label="Nom *">
          <input
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5"
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5"
          />
        </Field>
        <Field label="Téléphone WhatsApp *">
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5"
            placeholder="+33 6 12 34 56 78"
          />
        </Field>
      </div>

      <Field label="Mode de financement">
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5"
        >
          <option value="direct">Je paie directement (acompte 30%)</option>
          <option value="financement">Je souhaite un financement CPF / OPCO / France Travail</option>
          <option value="unknown">Je ne sais pas encore</option>
        </select>
      </Field>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            required
            checked={consentTraining}
            onChange={(e) => setConsentTraining(e.target.checked)}
            className="mt-1"
          />
          <span>
            * J'accepte de recevoir des informations sur cette formation.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consentPartner}
            onChange={(e) => setConsentPartner(e.target.checked)}
            className="mt-1"
          />
          <span>
            J'accepte d'être contacté par un conseiller pour le montage de mon dossier
            administratif (optionnel).
          </span>
        </label>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-on-primary font-black py-4 rounded-lg hover:opacity-90 disabled:opacity-50 active:scale-[0.99] transition-all"
      >
        {submitting
          ? "Envoi en cours…"
          : isFull
          ? "M'inscrire en liste d'attente"
          : "Confirmer ma réservation"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
    </div>
  );
}
