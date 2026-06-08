import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getFundingPartnerExportAdminFn,
  getLeadsAdminFn,
  logFundingPartnerExportAdminFn,
} from "../lib/admin.functions";
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
  Award,
  Wallet,
  Download,
  CalendarClock
} from "lucide-react";
import { toast } from "sonner";

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
  profil_financement: "Profil Financement",
  qualification_post_bilan: "Financement post-bilan",
};

const FUNDING_STATUS_LABELS: Record<string, string> = {
  not_requested: "Sans demande",
  interested: "A rappeler",
  to_qualify: "A qualifier",
  ready_to_transmit: "Pret a transmettre",
  transmitted: "Transmis",
};

const FUNDING_STATUS_BADGES: Record<string, string> = {
  interested: "bg-blue-50 text-blue-700 border-blue-200",
  to_qualify: "bg-amber-50 text-amber-700 border-amber-200",
  ready_to_transmit: "bg-emerald-50 text-emerald-700 border-emerald-200",
  transmitted: "bg-teal-50 text-teal-700 border-teal-200",
};

const LEAD_INTENT_LABELS: Record<string, string> = {
  training: "Formation",
  training_financing: "Financement formation",
  admin_accompaniment: "Accompagnement admin",
  training_and_admin_accompaniment: "Formation + accompagnement",
};

const FUNDING_NEXT_ACTION_LABELS: Record<string, string> = {
  call_candidate: "Appeler",
  complete_profile: "Completer le profil",
  prepare_export: "Preparer l'export",
  wait_partner: "Attendre partenaire",
  no_action: "Aucune action",
};

export function AdminLeads() {
  const getLeads = useServerFn(getLeadsAdminFn);
  const getFundingPartnerExport = useServerFn(getFundingPartnerExportAdminFn);
  const logFundingPartnerExport = useServerFn(logFundingPartnerExportAdminFn);
  const navigate = useNavigate();

  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportingFunding, setExportingFunding] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [leadIntent, setLeadIntent] = useState("all");
  const [partnerStatus, setPartnerStatus] = useState("all");
  const [fundingOnly, setFundingOnly] = useState(false);
  const [fundingStatus, setFundingStatus] = useState("all");
  const [fundingFollowup, setFundingFollowup] = useState<"all" | "overdue" | "upcoming">("all");
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
          leadIntent,
          partnerStatus,
          fundingOnly,
          fundingStatus,
          fundingFollowup,
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
  }, [search, status, level, source, leadIntent, partnerStatus, fundingOnly, fundingStatus, fundingFollowup, page, getLeads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setLevel("all");
    setSource("all");
    setLeadIntent("all");
    setPartnerStatus("all");
    setFundingOnly(false);
    setFundingStatus("all");
    setFundingFollowup("all");
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const handleFundingExport = async () => {
    setExportingFunding(true);
    try {
      const res = await getFundingPartnerExport();

      if (res.leads.length === 0) {
        toast.error("Aucun dossier financement pret a transmettre.");
        return;
      }

      const headers = [
        "lead_id",
        "date_creation",
        "nom",
        "prenom",
        "email",
        "whatsapp",
        "date_naissance",
        "nationalite",
        "adresse",
        "code_postal",
        "ville",
        "objectif",
        "niveau_estime",
        "source",
        "tunnel",
        "intention_lead",
        "attempt_id",
        "statut_financement",
        "situation_professionnelle",
        "secteur_activite",
        "statut_cpf",
        "solde_cpf_declare",
        "france_travail",
        "soutien_employeur",
        "date_cible",
        "parcours_recommande",
        "examen_cible",
        "tarif_public",
        "consentement_financement",
        "consentement_financement_at",
        "version_consentement_financement",
        "note_candidat",
        "pieces_justificatives_collectees",
      ];

      const rows = res.leads.map((lead) => {
        const fundingProfile = lead.metadata?.funding_profile || {};
        const journey = fundingProfile.recommended_journey || {};

        return [
          lead.id,
          lead.created_at,
          lead.last_name || "",
          lead.first_name || "",
          lead.email || "",
          lead.whatsapp_phone || "",
          lead.birth_date || fundingProfile.birth_date || "",
          lead.nationality || fundingProfile.nationality || "",
          lead.address_line1 || fundingProfile.address_line1 || "",
          lead.postal_code || fundingProfile.postal_code || "",
          lead.city || fundingProfile.city || "",
          lead.goal || "",
          lead.estimated_level || "",
          lead.source || "",
          lead.tunnel || "",
          lead.lead_intent || "",
          lead.attempt_id || "",
          lead.funding_status || "",
          lead.professional_status || fundingProfile.professional_status || "",
          lead.sector_activity || fundingProfile.sector_activity || "",
          lead.cpf_status || fundingProfile.cpf_status || "",
          lead.cpf_balance_declared ?? fundingProfile.cpf_balance_declared ?? "",
          lead.france_travail_registered || fundingProfile.france_travail_registered || "",
          lead.employer_support || fundingProfile.employer_support || "",
          lead.funding_target_date || fundingProfile.target_date || "",
          journey.name || "",
          journey.exam_target || "",
          journey.public_price ?? "",
          lead.consent_partner ? "oui" : "non",
          lead.consent_timestamp || "",
          lead.consent_partner_text_version || "",
          lead.message || "",
          "Non - prequalification uniquement",
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map(toCsvCell).join(",")),
      ].join("\n");

      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BFF_financement_partenaire_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      try {
        await logFundingPartnerExport({
          data: {
            leadIds: res.leads.map((lead) => lead.id),
          },
        });
        toast.success("Export telecharge. Dossiers marques transmis.");
        await fetchLeads();
      } catch (auditError) {
        console.error(auditError);
        toast.error("Export telecharge, mais les dossiers n'ont pas ete marques transmis.");
      }
    } catch (err: any) {
      toast.error(err.message || "Export financement impossible.");
    } finally {
      setExportingFunding(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Prospects & Dossiers</h1>
          <p className="text-sm text-on-surface-variant mt-1">Gérez, qualifiez et suivez l'orientation de chaque candidat inscrit.</p>
          <p className="mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-emerald-800">
            L'export financement contient les profils consentants prets a transmettre.
            Il reste une prequalification : aucune piece justificative n'est collectee a ce stade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleFundingExport}
            disabled={exportingFunding}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {exportingFunding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Download size={16} />
            )}
            Export financement
          </button>
          <button
            onClick={fetchLeads}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container active:scale-95 transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
            Actualiser
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface border-b border-outline-variant/20 pb-2">
          <Filter size={16} className="text-primary" />
          Filtres de recherche
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
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
              <option value="B2">Niveau B2 — Naturalisation</option>
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
              <option value="profil_financement">Profil Financement</option>
              <option value="qualification_post_bilan">Financement post-bilan</option>
            </select>
          </div>

          <div>
            <select
              value={leadIntent}
              onChange={(e) => { setLeadIntent(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Toutes les intentions</option>
              <option value="training">Formation</option>
              <option value="training_financing">Financement formation</option>
              <option value="admin_accompaniment">Accompagnement admin</option>
              <option value="training_and_admin_accompaniment">Formation + accompagnement</option>
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

          <div>
            <select
              value={fundingStatus}
              onChange={(e) => { setFundingStatus(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Statut financement</option>
              <option value="interested">A rappeler</option>
              <option value="to_qualify">A qualifier</option>
              <option value="ready_to_transmit">Pret a transmettre</option>
              <option value="transmitted">Transmis</option>
            </select>
          </div>

          <div>
            <select
              value={fundingFollowup}
              onChange={(e) => {
                setFundingFollowup(e.target.value as "all" | "overdue" | "upcoming");
                setPage(1);
              }}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:border-primary text-on-surface font-semibold"
            >
              <option value="all">Toutes les relances</option>
              <option value="overdue">Relances en retard</option>
              <option value="upcoming">Relances a venir</option>
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 text-sm font-bold text-on-surface">
          <input
            type="checkbox"
            checked={fundingOnly}
            onChange={(e) => {
              setFundingOnly(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-primary"
          />
          Afficher uniquement les demandes financement
        </label>

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
                  <th className="px-6 py-4">Financement</th>
                  <th className="px-6 py-4">Partenaire</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {leads.map((lead) => {
                  const fundingTriage = getFundingTriage(lead);
                  const fundingFollowup = getFundingFollowup(lead);

                  return (
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
                      {lead.lead_intent && (
                        <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                          {LEAD_INTENT_LABELS[lead.lead_intent] || lead.lead_intent}
                        </div>
                      )}
                      {lead.financement_opt_in && (
                        <div className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black ${FUNDING_STATUS_BADGES[lead.funding_status] || "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                          <Wallet size={11} />
                          {FUNDING_STATUS_LABELS[lead.funding_status] || "Financement"}
                        </div>
                      )}
                      <div className="text-[10px] text-on-surface-variant mt-1">
                        Créé le {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="inline-flex items-center gap-1 text-xs font-black text-[#9d4222] bg-[#9d4222]/10 border border-[#9d4222]/20 px-2.5 py-1 rounded-lg">
                          <Award size={12} />
                          {lead.estimated_level || "—"}
                        </span>
                        {lead.metadata?.flags && Array.isArray(lead.metadata.flags) && lead.metadata.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {lead.metadata.flags.map((flag: string) => (
                              <span key={flag} className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.5 rounded text-[8px] whitespace-nowrap">
                                {flag.replace("FIABILITE_FAIBLE_", "FAIBLE_")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_BADGES[lead.status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {fundingTriage ? (
                        <div className="max-w-[190px] space-y-1.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${fundingTriage.className}`}>
                            {fundingTriage.label}
                          </span>
                          <p className="text-[11px] font-semibold leading-relaxed text-on-surface-variant">
                            {fundingTriage.detail}
                          </p>
                          {fundingFollowup && (
                            <div className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold leading-relaxed ${fundingFollowup.className}`}>
                              <div className="flex items-center gap-1">
                                <CalendarClock size={12} />
                                {fundingFollowup.label}
                              </div>
                              {fundingFollowup.action && (
                                <p className="mt-1 font-semibold">{fundingFollowup.action}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-on-surface-variant">—</span>
                      )}
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
                  );
                })}
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

function toCsvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function getFundingTriage(lead: any) {
  if (!lead.financement_opt_in) return null;

  if (lead.funding_status === "transmitted") {
    return {
      label: "Deja transmis",
      detail: "Le suivi se fait apres l'envoi.",
      className: "border-teal-200 bg-teal-50 text-teal-800",
    };
  }

  if (lead.funding_status === "ready_to_transmit") {
    return {
      label: "Pret Stafy",
      detail: "Present dans le prochain export financement.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (!lead.consent_partner) {
    return {
      label: "A rappeler",
      detail: "Consentement financement a obtenir avant transmission.",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  const missingFields = getFundingMissingFields(lead);
  if (missingFields.length > 0) {
    return {
      label: "Profil incomplet",
      detail: `A completer : ${missingFields.slice(0, 2).join(", ")}${missingFields.length > 2 ? "..." : ""}`,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return {
    label: "A valider",
    detail: "Profil complet a passer pret a transmettre.",
    className: "border-violet-200 bg-violet-50 text-violet-900",
  };
}

function getFundingMissingFields(lead: any) {
  const fundingProfile = lead.metadata?.funding_profile || {};
  const missingFields: string[] = [];

  if (!lead.last_name?.trim()) missingFields.push("nom");
  if (!lead.email?.trim() && !lead.whatsapp_phone?.trim()) missingFields.push("contact");
  if (!lead.goal?.trim()) missingFields.push("objectif");
  if (!(lead.professional_status || fundingProfile.professional_status)?.trim()) missingFields.push("situation");
  if (!(lead.cpf_status || fundingProfile.cpf_status)?.trim()) missingFields.push("CPF");
  if (!(lead.france_travail_registered || fundingProfile.france_travail_registered)?.trim()) missingFields.push("France Travail");

  return missingFields;
}

function getFundingFollowup(lead: any) {
  if (!lead.financement_opt_in || !lead.funding_followup_at) return null;

  const followupAt = new Date(lead.funding_followup_at);
  if (Number.isNaN(followupAt.getTime())) return null;

  const now = new Date();
  const isOverdue = followupAt.getTime() < now.getTime();
  const isToday = followupAt.toLocaleDateString("fr-FR") === now.toLocaleDateString("fr-FR");
  const dateLabel = followupAt.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const nextAction = lead.funding_next_action
    ? FUNDING_NEXT_ACTION_LABELS[lead.funding_next_action] || lead.funding_next_action
    : "";

  if (isOverdue) {
    return {
      label: `Relance en retard - ${dateLabel}`,
      action: nextAction,
      className: "border-rose-200 bg-rose-50 text-rose-800",
    };
  }

  if (isToday) {
    return {
      label: `Relance aujourd'hui - ${dateLabel}`,
      action: nextAction,
      className: "border-orange-200 bg-orange-50 text-orange-900",
    };
  }

  return {
    label: `Relance prevue - ${dateLabel}`,
    action: nextAction,
    className: "border-sky-200 bg-sky-50 text-sky-800",
  };
}
