import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Video, CalendarDays, Wallet, Trophy } from "lucide-react";
import { getMyCohortFn } from "@/lib/apprenant.functions";
import { ApprenantLayout, EmptyCohortCTA, formatDateFrLong, formatTime, formatSlot } from "@/components/apprenant/ApprenantLayout";

export const Route = createFileRoute("/mon-espace/ma-cohorte")({
  head: () => ({
    meta: [
      { title: "Ma cohorte — Espace apprenant | Bilan Français Formation" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MaCohortePage,
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Brouillon", cls: "bg-surface-container text-on-surface-variant" },
  open: { label: "Ouverte", cls: "bg-blue-100 text-blue-700" },
  confirming: { label: "Confirmation", cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmée", cls: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "En cours", cls: "bg-primary/10 text-primary" },
  completed: { label: "Terminée", cls: "bg-surface-container text-on-surface-variant" },
  cancelled: { label: "Annulée", cls: "bg-red-100 text-red-700" },
};

function MaCohortePage() {
  const fn = useServerFn(getMyCohortFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["apprenant", "ma-cohorte"],
    queryFn: () => fn(),
  });

  return (
    <ApprenantLayout>
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-900">
          Erreur de chargement : {(error as Error).message}
        </div>
      )}
      {data && !data.cohort && <EmptyCohortCTA />}
      {data && data.cohort && (
        <Content data={data} />
      )}
    </ApprenantLayout>
  );
}

function Content({ data }: { data: any }) {
  const { cohort, journey, sessions, nextSession, pastCount, totalCount, enrollment } = data;
  const status = STATUS_LABEL[cohort.status] ?? STATUS_LABEL.draft;
  const progressPct = totalCount > 0 ? Math.round((pastCount / totalCount) * 100) : 0;

  const schedule = Array.isArray(cohort.weekly_schedule) ? cohort.weekly_schedule : [];

  const upcomingExam = sessions.find(
    (s: any) => s.session_type === "exam_blanc" && s.session_date >= new Date().toISOString().slice(0, 10),
  );
  const examIndex = upcomingExam
    ? [cohort.exam_blank_1_session, cohort.exam_blank_2_session, cohort.exam_blank_3_session].indexOf(upcomingExam.session_number) + 1
    : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Ma formation */}
      <section className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-outline mb-3">Ma formation</h2>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-bold text-on-surface">{journey?.title ?? "Parcours"}</h3>
            <p className="text-sm text-on-surface-variant capitalize">
              Intensité : <span className="font-medium">{cohort.intensity}</span>
              {cohort.code && <span className="text-outline"> · {cohort.code}</span>}
            </p>
          </div>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
            {status.label}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <p className="text-xs text-outline">Démarrage</p>
            <p className="font-semibold text-on-surface">{formatDateFrLong(cohort.start_date)}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low">
            <p className="text-xs text-outline">Fin estimée</p>
            <p className="font-semibold text-on-surface">{formatDateFrLong(cohort.estimated_end_date)}</p>
          </div>
        </div>

        {schedule.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-outline mb-2">Créneaux hebdomadaires</p>
            <ul className="space-y-1.5">
              {schedule.map((s: any, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-on-surface">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  {formatSlot(s)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cohort.meeting_url && (
          <a
            href={cohort.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
          >
            <Video className="w-4 h-4" />
            Rejoindre la visio
          </a>
        )}
      </section>

      {/* Ma progression */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-outline mb-3">Ma progression</h2>
        <p className="text-3xl font-extrabold text-primary mb-1">
          {pastCount}<span className="text-base text-outline"> / {totalCount}</span>
        </p>
        <p className="text-xs text-outline mb-3">séances effectuées</p>
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-5">
          <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
        </div>

        {nextSession && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Prochaine séance</p>
            <p className="text-sm font-semibold text-on-surface">
              N°{nextSession.session_number} — {formatDateFrLong(nextSession.session_date)}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {formatTime(nextSession.start_time)} – {formatTime(nextSession.end_time)}
            </p>
            {nextSession.meeting_url && (
              <a
                href={nextSession.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <Video className="w-3.5 h-3.5" /> Lien visio
              </a>
            )}
          </div>
        )}

        {upcomingExam && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Prochain examen blanc
            </p>
            <p className="text-sm font-semibold text-amber-950">
              {examIndex > 0 ? `${examIndex}${examIndex === 1 ? "er" : "ème"} examen` : "Examen blanc"} — {formatDateFrLong(upcomingExam.session_date)}
            </p>
          </div>
        )}
      </section>

      {/* Financement */}
      <section className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-outline mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Mon financement
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-surface-container-low">
            <p className="text-xs text-outline">Mode de financement</p>
            <p className="font-semibold text-on-surface capitalize">
              {enrollment?.payment_mode?.replace(/_/g, " ") ?? "Non précisé"}
            </p>
          </div>
          {enrollment?.stafy_status && enrollment.stafy_status !== "not_sent" && (
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-xs text-outline">Statut Stafy</p>
              <p className="font-semibold text-on-surface capitalize">
                {enrollment.stafy_status.replace(/_/g, " ")}
              </p>
            </div>
          )}
          {enrollment?.payment_mode === "direct" && (
            <div className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-xs text-outline">Payé / Solde dû</p>
              <p className="font-semibold text-on-surface">
                {Number(enrollment.total_paid ?? 0).toFixed(0)} € / {Number(enrollment.solde_due ?? 0).toFixed(0)} €
              </p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Link to="/financement" className="text-sm font-semibold text-primary hover:underline">
            En savoir plus sur mon financement →
          </Link>
        </div>
      </section>
    </div>
  );
}
