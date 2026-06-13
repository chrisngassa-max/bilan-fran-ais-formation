import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Users, GraduationCap, Target, ExternalLink, Video } from "lucide-react";
import { getDashboardStatsFn } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const SOURCE_LABELS: Record<string, string> = {
  accompagnement_admin: "Accompagnement (T1)",
  test_rapide: "Test Rapide (T2)",
  test_complet: "Test Complet (T3)",
  session_directe: "Réservation directe",
};

function formatFr(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string): number {
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function AdminDashboard() {
  const fn = useServerFn(getDashboardStatsFn);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fn(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-900">
        {(error as Error).message}
      </div>
    );
  }
  if (!data) return null;

  const pctMonth =
    data.leadsLastMonth > 0
      ? Math.round(((data.leadsThisMonth - data.leadsLastMonth) / data.leadsLastMonth) * 100)
      : null;

  const maxSource = Math.max(1, ...data.leadsBySource.map((s) => s.count));
  const hasAlerts = data.dangerCohorts.length > 0 || data.partnerRequestsCount > 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Dashboard</h1>
          <p className="text-sm text-outline">Vue temps réel de l'activité</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-low disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Section 1 — Alertes */}
      {hasAlerts && (
        <section className="space-y-3">
          {data.dangerCohorts.map((c: any) => {
            const d = daysUntil(c.start_date);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-900">
                    🔴 Cohorte <strong>{c.code || c.id.slice(0, 8)}</strong> démarre dans{" "}
                    <strong>{d > 0 ? `${d} jour${d > 1 ? "s" : ""}` : "moins d'un jour"}</strong> — seulement{" "}
                    <strong>{c.enrolled_count}</strong> inscrit{c.enrolled_count > 1 ? "s" : ""} (min{" "}
                    {c.min_students_to_confirm} requis)
                  </p>
                </div>
                <Link
                  to="/admin/cohortes/$cohortId"
                  params={{ cohortId: c.id }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 shrink-0"
                >
                  Gérer →
                </Link>
              </div>
            );
          })}
          {data.partnerRequestsCount > 0 && (
            <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-900">
                  🟠 <strong>{data.partnerRequestsCount}</strong> lead{data.partnerRequestsCount > 1 ? "s" : ""} avec demande partenaire en attente
                </p>
              </div>
              <Link
                to="/admin/leads"
                search={{ partnerStatus: "partner_requested_but_unassigned" } as any}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 shrink-0"
              >
                Voir →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Section 2 — KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Nouveaux leads ce mois"
          value={data.leadsThisMonth}
          extra={
            pctMonth !== null ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  pctMonth >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {pctMonth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {pctMonth >= 0 ? "+" : ""}
                {pctMonth}% vs mois dernier
              </span>
            ) : (
              <span className="text-xs text-outline">Pas de référence</span>
            )
          }
        />
        <KpiCard
          icon={GraduationCap}
          label="Apprenants actifs"
          value={data.activeEnrollments}
          extra={<span className="text-xs text-outline">Enrollments en cours</span>}
        />
        <KpiCard
          icon={Target}
          label="Cohortes actives"
          value={data.activeCohorts.length}
          extra={
            <p className="text-xs text-outline truncate" title={data.activeCohorts.map((c: any) => c.code).join(", ")}>
              {data.activeCohorts.map((c: any) => c.code).filter(Boolean).slice(0, 4).join(" · ") || "—"}
            </p>
          }
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux remplissage moyen"
          value={`${data.fillRate}%`}
          extra={<span className="text-xs text-outline">Cohortes ouvertes</span>}
        />
      </section>

      {/* Section 3 — Leads par source */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/50">
        <h2 className="text-sm font-bold text-on-surface mb-4">Leads par source (ce mois)</h2>
        <div className="space-y-3">
          {data.leadsBySource.map((s) => {
            const pct = Math.round((s.count / maxSource) * 100);
            return (
              <div key={s.source}>
                <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                  <span className="font-medium">{SOURCE_LABELS[s.source] || s.source}</span>
                  <span className="font-bold">{s.count}</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4 — Prochaines séances */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/50">
        <h2 className="text-sm font-bold text-on-surface mb-4">Prochaines séances</h2>
        {data.upcomingSessions.length === 0 ? (
          <p className="text-sm text-outline italic">Aucune séance planifiée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-outline border-b border-outline-variant">
                  <th className="pb-2 pr-4">Date & heure</th>
                  <th className="pb-2 pr-4">Cohorte</th>
                  <th className="pb-2 pr-4">Apprenants</th>
                  <th className="pb-2">Visio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.upcomingSessions.map((s: any) => (
                  <tr key={s.id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-on-surface">{formatFr(s.session_date)}</p>
                      <p className="text-xs text-outline">
                        {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs px-2 py-1 bg-surface-container rounded">
                        {s.cohorts?.code || s.cohort_id?.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-on-surface-variant">{s.attendees}</td>
                    <td className="py-3">
                      {s.meeting_url ? (
                        <a
                          href={s.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" /> Lien
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-outline">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: any;
  label: string;
  value: number | string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/50">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-3xl font-extrabold text-on-surface mb-2">{value}</p>
      {extra}
    </div>
  );
}
