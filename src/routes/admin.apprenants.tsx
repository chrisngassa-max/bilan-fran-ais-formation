import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Search, Download, MessageCircle } from "lucide-react";
import { getApprenantsAdminFn } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/admin/apprenants")({
  component: ApprenantsPage,
});

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente paiement", color: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmé", color: "bg-emerald-100 text-emerald-800" },
  waiting_list: { label: "Liste d'attente", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Annulé", color: "bg-surface-container text-on-surface-variant" },
};

const STAFY_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "Non démarré", color: "bg-surface-container text-on-surface-variant" },
  to_create: { label: "À créer", color: "bg-amber-100 text-amber-800" },
  created: { label: "Créé", color: "bg-blue-100 text-blue-800" },
  synced: { label: "Synchronisé", color: "bg-emerald-100 text-emerald-800" },
};

function formatFr(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ApprenantsPage() {
  const fn = useServerFn(getApprenantsAdminFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "apprenants"],
    queryFn: () => fn(),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!data?.rows) return [];
    const q = search.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (cohortFilter !== "all" && r.cohort_id !== cohortFilter) return false;
      if (q) {
        const hay = `${r.first_name || ""} ${r.email || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, statusFilter, cohortFilter]);

  const exportCsv = () => {
    const header = [
      "Nom",
      "Email",
      "WhatsApp",
      "Niveau",
      "Cohorte",
      "Parcours",
      "Démarrage",
      "Statut",
      "Mode paiement",
      "Stafy",
      "Total payé",
      "Réservé le",
    ];
    const rows = filtered.map((r) => [
      r.first_name || "",
      r.email || "",
      r.whatsapp_phone || "",
      r.estimated_level || "",
      r.cohort_code || "",
      r.journey_name || "",
      r.cohort_start_date ? formatFr(r.cohort_start_date) : "",
      STATUS_LABELS[r.status]?.label || r.status || "",
      r.payment_mode || "",
      STAFY_LABELS[r.stafy_status]?.label || r.stafy_status || "",
      r.total_paid != null ? String(r.total_paid) : "",
      r.reserved_at ? formatFr(r.reserved_at) : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apprenants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Apprenants</h1>
          <p className="text-sm text-outline">
            Tous les leads ayant réservé une session{data?.rows ? ` · ${data.rows.length} au total` : ""}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-outline-variant/50 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche (nom, email)"
            className="w-full pl-9 pr-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={cohortFilter}
          onChange={(e) => setCohortFilter(e.target.value)}
          className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Toutes les cohortes</option>
          {(data?.cohorts || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} {c.title ? `— ${c.title}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-outline-variant/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-700 bg-red-50">{(error as Error).message}</div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-outline italic">Aucun apprenant ne correspond aux filtres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr className="text-left text-xs uppercase tracking-wider text-outline">
                  <th className="px-4 py-3">Apprenant</th>
                  <th className="px-4 py-3">Cohorte</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Stafy</th>
                  <th className="px-4 py-3">Total payé</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const st = STATUS_LABELS[r.status] || { label: r.status || "—", color: "bg-surface-container text-on-surface-variant" };
                  const sf = STAFY_LABELS[r.stafy_status] || { label: r.stafy_status || "—", color: "bg-surface-container text-on-surface-variant" };
                  return (
                    <tr key={r.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface">{r.first_name || "—"}</p>
                        <p className="text-xs text-outline">{r.email}</p>
                        {r.estimated_level && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {r.estimated_level}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.cohort_id ? (
                          <Link
                            to="/admin/cohortes/$cohortId"
                            params={{ cohortId: r.cohort_id }}
                            className="font-mono text-xs px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded"
                          >
                            {r.cohort_code}
                          </Link>
                        ) : "—"}
                        <p className="text-xs text-outline mt-1">{r.journey_name}</p>
                        <p className="text-xs text-outline">Début {formatFr(r.cohort_start_date)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{r.payment_mode || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${sf.color}`}>
                          {sf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-on-surface">
                        {r.total_paid != null ? `${r.total_paid} €` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {r.whatsapp_phone && (
                            <a
                              href={`https://wa.me/${r.whatsapp_phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          {r.lead_id && (
                            <Link
                              to="/admin/leads/$leadId"
                              params={{ leadId: r.lead_id }}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Fiche →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
