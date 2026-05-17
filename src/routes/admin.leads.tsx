import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLeadsAdminFn } from "../lib/admin.functions";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  RefreshCw,
  Mail,
  Phone,
  Layers,
  Award
} from "lucide-react";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Gestion des prospects — Console Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLeads,
});

const STATUS_BADGES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  qualified: "bg-amber-50 text-amber-700 border-amber-200",
  converted_to_case: "bg-emerald-50 text-emerald-700 border-emerald-200",
  exported: "bg-indigo-50 text-indigo-700 border-indigo-200",
  archived: "bg-zinc-50 text-zinc-600 border-zinc-200",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  qualified: "Qualifié",
  converted_to_case: "Transmis cas",
  exported: "Exporté",
  archived: "Archivé",
};

const PARTNER_STATUS_BADGES: Record<string, string> = {
  unassigned: "bg-zinc-50 text-zinc-500 border-zinc-200",
  partner_requested_but_unassigned: "bg-red-50 text-red-700 border-red-200 animate-pulse",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  transmitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  acknowledged: "bg-teal-50 text-teal-700 border-teal-200",
};

const PARTNER_STATUS_LABELS: Record<string, string> = {
  unassigned: "Non affecté",
  partner_requested_but_unassigned: "Demande partenaire",
  assigned: "Assigné",
  transmitted: "Transmis",
  acknowledged: "Pris en charge",
};

const SOURCE_LABELS: Record<string, string> = {
  test_complet: "Test Complet (T3)",
  test_rapide: "Test Rapide (T2)",
  accompagnement_admin: "Accompagnement (T1)",
  bilan_post_result: "Bilan Diagnostic",
};

export function AdminLeads() {
  const getLeads = useServerFn(getLeadsAdminFn);
  const navigate = useNavigate();

  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [partnerStatus, setPartnerStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads({
        data: {
          search,
          status,
          level,
          source,
          partnerStatus,
          page,
          limit,
        },
      });
      setLeads(res.leads);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status, level, source, partnerStatus, page, getLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setLevel("all");
    setSource("all");
    setPartnerStatus("all");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Prospects & Dossiers</h1>
          <p className="text-sm text-on-surface-variant mt-1">Gérez, qualifiez et suivez l'orientation de chaque candidat inscrit.</p>
        </div>
        <button
          onClick={fetchLeads}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
          Actualiser
        </button>
      </header>

      {/* Filters Bar */}
      <section className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-2">
          <Filter size={16} className="text-primary" />
          Filtres de recherche
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Rechercher nom, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Tous les Statuts</option>
              <option value="new">Nouveau</option>
              <option value="qualified">Qualifié</option>
              <option value="converted_to_case">Transmis cas</option>
              <option value="exported">Exporté</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          <div>
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Tous les Niveaux</option>
              <option value="A1">Niveau A1</option>
              <option value="A2">Niveau A2</option>
              <option value="B1">Niveau B1</option>
              <option value="B1_nat">B1 Naturalisation</option>
              <option value="B2">Niveau B2</option>
              <option value="a_verifier">À vérifier</option>
            </select>
          </div>

          <div>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Toutes les Sources</option>
              <option value="accompagnement_admin">Accompagnement (T1)</option>
              <option value="test_rapide">Test Rapide (T2)</option>
              <option value="test_complet">Test Complet (T3)</option>
              <option value="bilan_post_result">Bilan Diagnostic</option>
            </select>
          </div>

          <div>
            <select
              value={partnerStatus}
              onChange={(e) => { setPartnerStatus(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Orientation Partenaire</option>
              <option value="unassigned">Non orienté</option>
              <option value="partner_requested_but_unassigned">Demande en attente</option>
              <option value="assigned">Assigné</option>
              <option value="transmitted">Transmis</option>
              <option value="acknowledged">Pris en charge</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs">
          <p className="text-on-surface-variant font-bold">
            Total : <span className="text-primary text-sm font-black">{total}</span> prospect(s) trouvé(s)
          </p>
          <button
            onClick={handleResetFilters}
            className="text-primary hover:underline font-bold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </section>

      {/* Leads Table */}
      <section className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
            <p className="text-sm font-bold text-on-surface-variant animate-pulse">Chargement des données...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant bg-white space-y-2">
            <p className="font-extrabold text-lg">Aucun dossier trouvé</p>
            <p className="text-sm">Essayez de modifier les termes de votre recherche ou les filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant/20 text-xs uppercase font-extrabold text-on-surface-variant tracking-wider">
                  <th className="px-6 py-4">Nom / Contact</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Niveau</th>
                  <th className="px-6 py-4">Statut Traitement</th>
                  <th className="px-6 py-4">Partenaire</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface text-base">
                        {lead.first_name} {lead.last_name || ""}
                      </div>
                      <div className="flex flex-col gap-1 mt-1 text-xs text-on-surface-variant">
                        {lead.email && (
                          <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>
                        )}
                        {lead.whatsapp_phone && (
                          <span className="flex items-center gap-1"><Phone size={12} /> {lead.whatsapp_phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-on-surface bg-surface-container px-2.5 py-1 rounded-full">
                        <Layers size={12} className="text-primary" />
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </span>
                      <div className="text-[10px] text-on-surface-variant mt-1">
                        Créé le {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-black text-[#9d4222] bg-[#9d4222]/10 border border-[#9d4222]/20 px-2.5 py-1 rounded-lg">
                        <Award size={12} />
                        {lead.estimated_level || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_BADGES[lead.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${PARTNER_STATUS_BADGES[lead.partner_status] || "bg-gray-100 text-gray-800"}`}>
                        {PARTNER_STATUS_LABELS[lead.partner_status] || lead.partner_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate({ to: `/admin/leads/$leadId`, params: { leadId: lead.id } })}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-on-primary px-3 text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                      >
                        <Eye size={14} />
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-surface/50 border-t border-outline-variant/20 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-white px-3 text-xs font-bold text-on-surface shadow-sm hover:bg-surface-container disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            <span className="text-xs font-bold text-on-surface-variant">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-outline-variant bg-white px-3 text-xs font-bold text-on-surface shadow-sm hover:bg-surface-container disabled:opacity-50 transition-all"
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
