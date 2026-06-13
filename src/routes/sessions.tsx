import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Users, ArrowRight, AlertCircle, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { waHref } from "@/config/site";

const SESSIONS_TIMEOUT_MS = 8000;

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Prochaines sessions de formation — Bilan Français Formation" },
      {
        name: "description",
        content:
          "Découvrez les prochaines sessions de formation au français. Réservez votre place dans un groupe à effectif limité.",
      },
      { property: "og:title", content: "Prochaines sessions de formation — Bilan Français Formation" },
      {
        property: "og:description",
        content:
          "Sessions ouvertes à l'inscription. Préparation TCF, carte de séjour, naturalisation.",
      },
    ],
  }),
  component: SessionsPage,
});

type PublicCohort = {
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
    duration_weeks: number | null;
    level: string | null;
  } | null;
  enrolled_count: number;
};

const INTENSITY_LABEL: Record<string, { label: string; cls: string }> = {
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
  const days = weekly
    .map((s: any) => {
      const day = (s.day || s.jour || "").toString().slice(0, 3);
      const time = s.start || s.start_time || s.heure || "";
      return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${time}`.trim();
    })
    .join(" + ");
  return days;
}

function StatusBadge({ cohort }: { cohort: PublicCohort }) {
  const enrolled = cohort.enrolled_count;
  if (cohort.status === "confirmed") {
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
        🟢 Confirmé — démarre le {new Date(cohort.start_date).toLocaleDateString("fr-FR")}
      </span>
    );
  }
  if (cohort.status === "confirming" || enrolled >= cohort.min_students_to_confirm) {
    return (
      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold animate-pulse">
        🟡 Bientôt confirmé
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[11px] font-bold">
      🔵 En cours de constitution
    </span>
  );
}

function SessionsPage() {
  const [cohorts, setCohorts] = useState<PublicCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");
  const [period, setPeriod] = useState<string>("all");

  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => {
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const work = (async () => {
      const { data, error } = await supabase
        .from("cohorts")
        .select(
          "id, code, intensity, status, start_date, estimated_end_date, max_students, min_students_to_confirm, weekly_schedule, total_sessions, meeting_url, formation_journey_id, formation_journeys(title, duration_weeks, level)"
        )
        .eq("visibility", "public")
        .in("status", ["open", "confirming", "confirmed"])
        .order("start_date", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as any[];
      // Fetch enrolled counts via RPC for each cohort
      const counts = await Promise.all(
        rows.map(async (c: any) => {
          const { data: cnt } = await supabase.rpc("get_cohort_enrolled_count", {
            p_cohort_id: c.id,
          });
          return { id: c.id, count: (cnt as number) ?? 0 };
        })
      );
      const countMap = new Map(counts.map((x) => [x.id, x.count]));
      return rows.map((c) => ({
        ...c,
        enrolled_count: countMap.get(c.id) ?? 0,
      })) as PublicCohort[];
    })();

    // Timeout de garde : 8 s → on bascule en état d'erreur plutôt qu'un spinner infini
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Le chargement des sessions a expiré.")),
        SESSIONS_TIMEOUT_MS
      );
    });

    Promise.race([work, timeout])
      .then((merged) => {
        if (!cancelled) setCohorts(merged as PublicCohort[]);
      })
      .catch((e: any) => {
        if (cancelled) return;
        trackEvent("sessions_load_error", { reason: e?.message || "unknown" });
        setError(e?.message || "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const now = new Date();
    const in3months = new Date();
    in3months.setMonth(in3months.getMonth() + 3);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return cohorts.filter((c) => {
      if (intensity !== "all" && c.intensity !== intensity) return false;
      if (format !== "all") {
        const isVisio = !!c.meeting_url;
        if (format === "visio" && !isVisio) return false;
        if (format === "presentiel" && isVisio) return false;
      }
      if (period !== "all") {
        const start = new Date(c.start_date);
        if (period === "month" && start > endOfMonth) return false;
        if (period === "3months" && start > in3months) return false;
      }
      return true;
    });
  }, [cohorts, intensity, format, period]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Calendar className="h-4 w-4" /> Prochaines sessions
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Réservez votre place dans une session
          </h1>
          <p className="text-slate-600">
            Groupes limités à 6 élèves pour un suivi de qualité. Ouvertes à
            l'inscription dès maintenant.
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end shadow-sm">
          <FilterSelect
            label="Intensité"
            value={intensity}
            onChange={setIntensity}
            options={[
              { v: "all", l: "Toutes" },
              { v: "standard", l: "Standard" },
              { v: "intensif", l: "Intensif" },
              { v: "express", l: "Express" },
            ]}
          />
          <FilterSelect
            label="Format"
            value={format}
            onChange={setFormat}
            options={[
              { v: "all", l: "Tous" },
              { v: "visio", l: "Visio" },
              { v: "presentiel", l: "Présentiel" },
            ]}
          />
          <FilterSelect
            label="Période"
            value={period}
            onChange={setPeriod}
            options={[
              { v: "all", l: "Toutes" },
              { v: "month", l: "Ce mois" },
              { v: "3months", l: "3 prochains mois" },
            ]}
          />
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-6 w-28 bg-slate-200 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-1/2 bg-slate-100 rounded" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full" />
                <div className="h-11 w-full bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-8 rounded-2xl border border-red-200 text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-red-800 font-bold">Les sessions n'ont pas pu être chargées.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={retry}
                className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all"
              >
                Réessayer
              </button>
              <a
                href={waHref("Bonjour, je n'arrive pas à voir les prochaines sessions de formation et je souhaite des informations.")}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("whatsapp_clicked", { from: "sessions_error" })}
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba56] text-white px-5 py-3 rounded-lg font-bold transition-all"
              >
                <MessageCircle className="h-4 w-4" /> Nous contacter sur WhatsApp
              </a>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <p className="text-slate-700 font-semibold">
              Aucune session n'est ouverte à l'inscription pour le moment.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-lg font-bold hover:opacity-90"
            >
              Être notifié à l'ouverture des prochaines sessions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <CohortCard key={c.id} cohort={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}

function CohortCard({ cohort }: { cohort: PublicCohort }) {
  const intensityBadge = INTENSITY_LABEL[cohort.intensity] || INTENSITY_LABEL.standard;
  const remaining = Math.max(0, cohort.max_students - cohort.enrolled_count);
  const isFull = remaining === 0;
  const lowSeats = remaining > 0 && remaining <= 2;
  const progressPct = Math.min(
    100,
    Math.round((cohort.enrolled_count / Math.max(1, cohort.max_students)) * 100)
  );
  const journey = cohort.formation_journeys;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex justify-between items-start gap-2">
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${intensityBadge.cls}`}
        >
          {intensityBadge.label}
        </span>
        <StatusBadge cohort={cohort} />
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">
          {journey?.title || "Parcours de formation"}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {journey?.duration_weeks ? `${journey.duration_weeks} sem. · ` : ""}
          {journey?.level ? `Niveau ${journey.level}` : ""}
        </p>
      </div>

      <div className="space-y-2 text-sm text-slate-700">
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          Démarre le {formatDateLong(cohort.start_date)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          {formatSchedule(cohort.weekly_schedule)}
        </p>
        <p className={`flex items-center gap-2 ${lowSeats ? "text-red-600 font-bold" : ""}`}>
          <Users className="h-4 w-4 text-slate-400" />
          {isFull
            ? "Complet"
            : lowSeats
            ? `🔴 Dernières places ! ${remaining} sur ${cohort.max_students}`
            : `${remaining} places restantes sur ${cohort.max_students}`}
        </p>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <Link
        to="/sessions/$cohortId"
        params={{ cohortId: cohort.id }}
        onClick={() => trackEvent("inscription_click", { cohort: cohort.code ?? cohort.id })}
        className="mt-2 inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all"
      >
        {isFull ? "Liste d'attente" : "Réserver ma place"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
