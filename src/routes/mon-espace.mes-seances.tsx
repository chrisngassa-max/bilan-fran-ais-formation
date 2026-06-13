import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Video, PenLine, CheckCircle2, XCircle, Clock, Star, ClipboardCheck } from "lucide-react";
import { getMySessionsFn } from "@/lib/apprenant.functions";
import { ApprenantLayout, EmptyCohortCTA, formatDateFrLong, formatTime } from "@/components/apprenant/ApprenantLayout";

export const Route = createFileRoute("/mon-espace/mes-seances")({
  head: () => ({
    meta: [
      { title: "Mes séances — Espace apprenant | Bilan Français Formation" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MesSeancesPage,
});

type Tab = "a_venir" | "passees" | "toutes";

function MesSeancesPage() {
  const fn = useServerFn(getMySessionsFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["apprenant", "mes-seances"],
    queryFn: () => fn(),
  });
  const [tab, setTab] = useState<Tab>("a_venir");

  return (
    <ApprenantLayout>
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-900">
          Erreur : {(error as Error).message}
        </div>
      )}
      {data && !data.cohort && <EmptyCohortCTA />}
      {data && data.cohort && <Content data={data} tab={tab} setTab={setTab} />}
    </ApprenantLayout>
  );
}

function Content({ data, tab, setTab }: { data: any; tab: Tab; setTab: (t: Tab) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const all = data.sessions as any[];
  const past = all.filter((s) => s.session_date < today);
  const upcoming = all.filter((s) => s.session_date >= today);

  const list = tab === "a_venir" ? upcoming : tab === "passees" ? past : all;

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-on-surface">
          Mes séances — {data.journey?.title ?? "Mon parcours"}
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          {past.length} séance{past.length > 1 ? "s" : ""} passée{past.length > 1 ? "s" : ""} ·{" "}
          {upcoming.length} à venir · {all.length} total
        </p>
        <div className="mt-4 flex gap-2">
          {([
            ["a_venir", "À venir"],
            ["passees", "Passées"],
            ["toutes", "Toutes"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-outline shadow-sm">
            Aucune séance.
          </div>
        )}
        {list.map((s) => (
          <SessionRow key={s.id} session={s} attendance={data.attendanceByS[s.id]} today={today} />
        ))}
      </div>
    </>
  );
}

function SessionRow({ session, attendance, today }: { session: any; attendance: any; today: string }) {
  const isPast = session.session_date < today;
  const isFuture = session.session_date > today;

  const typeBadge =
    session.session_type === "exam_blanc"
      ? { label: "Examen Blanc", icon: Star, cls: "bg-amber-100 text-amber-800" }
      : session.session_type === "bilan"
        ? { label: "Bilan", icon: ClipboardCheck, cls: "bg-emerald-100 text-emerald-700" }
        : { label: "Cours", icon: null as any, cls: "bg-blue-100 text-blue-700" };

  let statusEl: React.ReactNode = <span className="text-outline text-sm">—</span>;
  if (attendance) {
    if (attendance.status === "present") {
      statusEl = (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="w-4 h-4" /> Présent
        </span>
      );
    } else if (attendance.status === "absent") {
      statusEl = (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
          <XCircle className="w-4 h-4" /> Absent
        </span>
      );
    } else if (attendance.status === "pending" && isPast) {
      statusEl = (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700">
          <Clock className="w-4 h-4" /> À émarger
        </span>
      );
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-on-surface">
              Séance n°{session.session_number}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge.cls}`}>
              {typeBadge.icon && <typeBadge.icon className="w-3 h-3" />}
              {typeBadge.label}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">{formatDateFrLong(session.session_date)}</p>
          <p className="text-xs text-outline mt-0.5">
            {formatTime(session.start_time)} – {formatTime(session.end_time)}
          </p>
          {session.title && <p className="text-xs text-on-surface-variant mt-1 italic">{session.title}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {statusEl}
          {(isFuture || !isPast) && session.meeting_url && (
            <a
              href={session.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
            >
              <Video className="w-4 h-4" /> Rejoindre
            </a>
          )}
          {isPast && attendance?.status === "pending" && !attendance.signed_at && (
            <Link
              to="/mon-espace/emargement/$sessionId"
              params={{ sessionId: session.id }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
            >
              <PenLine className="w-4 h-4" /> Émarger
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
