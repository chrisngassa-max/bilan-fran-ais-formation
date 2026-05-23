import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calendar, Users, Video, ClipboardCheck, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getMesSeancesFn } from "@/lib/formateur.functions";

export const Route = createFileRoute("/formateur/mon-planning")({
  component: PlanningPage,
});

type Tab = "current" | "next" | "all";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function PlanningPage() {
  const [tab, setTab] = useState<Tab>("current");
  const [weekOffset, setWeekOffset] = useState(0);

  const range = useMemo(() => {
    const base = startOfWeek(new Date());
    if (tab === "all") return { from: undefined, to: undefined };
    const offset = tab === "next" ? 1 : weekOffset;
    const start = new Date(base);
    start.setDate(start.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { from: fmtDateISO(start), to: fmtDateISO(end), start, end };
  }, [tab, weekOffset]);

  const getSeances = useServerFn(getMesSeancesFn);
  const { data, isLoading } = useQuery({
    queryKey: ["formateur-seances", range.from, range.to],
    queryFn: () => getSeances({ data: { from: range.from, to: range.to } }),
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-on-surface">Mon planning</h1>
        <p className="text-sm font-bold text-on-surface-variant mt-1">
          Vos séances à venir et passées
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant">
        {[
          { id: "current" as Tab, label: "Cette semaine" },
          { id: "next" as Tab, label: "Semaine prochaine" },
          { id: "all" as Tab, label: "Tout voir" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setWeekOffset(0);
            }}
            className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "current" && range.start && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg border border-outline-variant hover:bg-surface"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-sm font-bold text-on-surface">
            Semaine du {range.start.toLocaleDateString("fr-FR")} au{" "}
            {range.end!.toLocaleDateString("fr-FR")}
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg border border-outline-variant hover:bg-surface"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-10 text-center text-sm font-bold text-on-surface-variant">
          Chargement...
        </div>
      ) : !data?.sessions.length ? (
        <div className="bg-white rounded-2xl border border-outline-variant p-10 text-center">
          <Calendar className="mx-auto mb-3 text-on-surface-variant" size={32} />
          <p className="text-sm font-bold text-on-surface-variant">
            Aucune séance sur cette période.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s: any) => {
            const sessionDateTime = new Date(`${s.session_date}T${s.start_time}`);
            const sessionEndTime = new Date(`${s.session_date}T${s.end_time}`);
            const isPast = sessionEndTime < now;
            const isCurrent = sessionDateTime <= now && sessionEndTime >= now;
            const minutesUntil =
              (sessionDateTime.getTime() - now.getTime()) / 1000 / 60;
            const canJoin = (minutesUntil <= 30 && minutesUntil >= 0) || isCurrent;
            const canEmarger = isPast || isCurrent;
            const isExam = s.session_type === "exam_blanc";

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-outline-variant p-5 flex flex-wrap items-center gap-4"
              >
                <div className="text-center min-w-[80px]">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">
                    {sessionDateTime.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </div>
                  <div className="text-2xl font-black text-on-surface">
                    {sessionDateTime.getDate()}
                  </div>
                  <div className="text-xs font-bold text-on-surface-variant">
                    {sessionDateTime.toLocaleDateString("fr-FR", { month: "short" })}
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-on-surface">
                      Séance n°{s.session_number}
                    </span>
                    {isExam && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                        <Star size={12} /> Examen Blanc
                      </span>
                    )}
                    {s.session_type === "bilan" && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-xs">
                        Bilan
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-on-surface-variant mt-1">
                    {s.start_time?.slice(0, 5)} → {s.end_time?.slice(0, 5)} ·{" "}
                    <span className="text-primary">{s.cohort_code}</span>
                    {s.journey_title && (
                      <span className="ml-1 opacity-70">— {s.journey_title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-1">
                    <Users size={12} /> {s.nb_apprenants} apprenant
                    {s.nb_apprenants > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canJoin && s.meeting_url && (
                    <a
                      href={s.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700"
                    >
                      <Video size={14} /> Rejoindre la visio
                    </a>
                  )}
                  {canEmarger && (
                    <Link
                      to="/formateur/emargement/$sessionId"
                      params={{ sessionId: s.id }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90"
                    >
                      <ClipboardCheck size={14} /> Émarger
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
