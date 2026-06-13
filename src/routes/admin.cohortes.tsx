import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listCohortsFn } from "../lib/cohortes.functions";
import { Plus, Filter, Eye, RefreshCw, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/admin/cohortes")({
  head: () => ({
    meta: [
      { title: "Cohortes & Sessions — Console Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminCohortes,
});

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  open: "bg-blue-50 text-blue-700 border-blue-200",
  confirming: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-surface-container text-on-surface-variant border-outline-variant",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  confirming: "En confirmation",
  confirmed: "Confirmé",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

const INTENSITY_LABELS: Record<string, string> = {
  standard: "Standard",
  intensif: "Intensif",
  express: "Express",
};

function AdminCohortes() {
  const list = useServerFn(listCohortsFn);
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [intensity, setIntensity] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await list({ data: { status, intensity } });
      setCohorts(res.cohorts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [list, status, intensity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Cohortes & Sessions</h1>
          <p className="text-sm text-on-surface-variant mt-1">Planifiez les groupes, suivez les inscriptions et confirmez les sessions de formation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container active:scale-95 transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
            Actualiser
          </button>
          <Link
            to="/admin/cohortes/nouveau"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={16} />
            Nouvelle cohorte
          </Link>
        </div>
      </header>

      <section className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-2 mb-4">
          <Filter size={16} className="text-primary" />
          Filtres
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Toutes les intensités</option>
            {Object.entries(INTENSITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
            <p className="text-sm font-bold text-on-surface-variant animate-pulse">Chargement...</p>
          </div>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-16 px-6 text-on-surface-variant space-y-3">
            <GraduationCap size={48} className="mx-auto text-outline-variant" />
            <p className="font-extrabold text-lg text-on-surface">Aucune cohorte</p>
            <p className="text-sm">Créez votre première session.</p>
            <Link to="/admin/cohortes/nouveau" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm hover:opacity-90 mt-2">
              <Plus size={16} /> Nouvelle cohorte
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant/20 text-xs uppercase font-extrabold text-on-surface-variant tracking-wider">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Parcours</th>
                  <th className="px-6 py-4">Démarrage</th>
                  <th className="px-6 py-4">Inscrits</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {cohorts.map((c) => {
                  const ratio = c.max_students ? (c.enrolled_count / c.max_students) * 100 : 0;
                  const belowMin = c.status === "confirming" && c.enrolled_count < c.min_students_to_confirm;
                  return (
                    <tr key={c.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-on-surface">{c.code || "—"}</span>
                        <div className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wider font-bold">
                          {INTENSITY_LABELS[c.intensity]}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface">
                        {c.formation_journeys?.title || "—"}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1">
                          <span>{c.enrolled_count} / {c.max_students}</span>
                          <span className="text-on-surface-variant">min {c.min_students_to_confirm}</span>
                        </div>
                        <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${belowMin ? "bg-amber-500" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_BADGES[c.status] || "bg-surface-container"} ${belowMin ? "animate-pulse" : ""}`}>
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate({ to: "/admin/cohortes/$cohortId", params: { cohortId: c.id } })}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-on-primary px-3 text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                        >
                          <Eye size={14} /> Ouvrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
