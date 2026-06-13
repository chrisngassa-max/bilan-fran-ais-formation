import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { 
  getLeadDetailAdminFn, 
  updateLeadStatusAdminFn, 
  updateLeadFundingStatusAdminFn,
  updateLeadFundingQualificationAdminFn,
  getPartnersAdminFn, 
  assignPartnerManualFn 
} from "../lib/admin.functions";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  Share2, 
  Send,
  UserCheck,
  ChevronDown,
  Building,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Dossier Prospect — Administration" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LeadDetailAdmin,
});

const WIZARD_STEPS = [
  "Validation Profil",
  "Audit RGPD",
  "Diagnostic CPF",
  "Sélection Partenaire",
  "Transmission"
];

export function LeadDetailAdmin() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  
  const getLeadDetail = useServerFn(getLeadDetailAdminFn);
  const updateStatus = useServerFn(updateLeadStatusAdminFn);
  const updateFundingStatus = useServerFn(updateLeadFundingStatusAdminFn);
  const updateFundingQualification = useServerFn(updateLeadFundingQualificationAdminFn);
  const getPartners = useServerFn(getPartnersAdminFn);
  const assignPartner = useServerFn(assignPartnerManualFn);

  const [lead, setLead] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [transmissions, setTransmissions] = useState<any[]>([]);
  const [dossier, setDossier] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [wizardNotes, setWizardNotes] = useState("");
  const [sendingTx, setSendingTx] = useState(false);
  const [updatingFundingStatus, setUpdatingFundingStatus] = useState(false);
  const [savingFundingQualification, setSavingFundingQualification] = useState(false);
  const [fundingNextAction, setFundingNextAction] = useState("");
  const [fundingFollowupAt, setFundingFollowupAt] = useState("");
  const [fundingInternalNotes, setFundingInternalNotes] = useState("");

  // General profile update
  const [statusVal, setStatusVal] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await getLeadDetail({ data: { leadId } });
      setLead(res.lead);
      setSessions(res.sessions);
      setEvents(res.events);
      setTransmissions(res.transmissions);
      setDossier((res as any).dossier ?? null);
      setStatusVal(res.lead.status);
      setFundingNextAction(res.lead.funding_next_action || "");
      setFundingFollowupAt(toDateTimeLocalValue(res.lead.funding_followup_at));
      setFundingInternalNotes(res.lead.funding_internal_notes || "");

      // Load active partners
      const partnersRes = await getPartners();
      setPartners(partnersRes.filter((p: any) => p.status === "active"));
    } catch (err: any) {
      toast.error(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [leadId, getLeadDetail, getPartners]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (newVal: string) => {
    try {
      await updateStatus({ data: { leadId, status: newVal } });
      setStatusVal(newVal);
      toast.success("Statut mis à jour avec succès !");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour");
    }
  };

  const handleUpdateFundingStatus = async (newVal: FundingStatus) => {
    setUpdatingFundingStatus(true);
    try {
      await updateFundingStatus({ data: { leadId, fundingStatus: newVal } });
      toast.success("Statut financement mis a jour.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise a jour financement");
    } finally {
      setUpdatingFundingStatus(false);
    }
  };

  const handleSaveFundingQualification = async () => {
    setSavingFundingQualification(true);
    try {
      await updateFundingQualification({
        data: {
          leadId,
          nextAction: fundingNextAction ? (fundingNextAction as FundingNextAction) : null,
          followupAt: fundingFollowupAt ? new Date(fundingFollowupAt).toISOString() : null,
          internalNotes: fundingInternalNotes.trim() || null,
        },
      });
      toast.success("Suivi financement enregistre.");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement financement");
    } finally {
      setSavingFundingQualification(false);
    }
  };

  const handleSendTransmission = async () => {
    if (!selectedPartnerId) {
      toast.error("Veuillez sélectionner un partenaire.");
      return;
    }
    setSendingTx(true);
    try {
      await assignPartner({
        data: {
          leadId,
          partnerId: selectedPartnerId,
          notes: wizardNotes
        }
      });
      toast.success("Dossier transmis avec succès au partenaire !");
      setWizardStep(5); // Advance to completion
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erreur de transmission");
    } finally {
      setSendingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
          <p className="text-sm font-bold text-on-surface-variant animate-pulse">Chargement de la fiche...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-bold text-on-surface">Prospect introuvable</p>
        <Link to="/admin/leads" className="text-primary hover:underline font-bold mt-4 inline-block">Retourner à la liste</Link>
      </div>
    );
  }

  const fundingReadiness = getFundingReadiness(lead);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-outline-variant/30">
        <div className="space-y-1.5">
          <Link to="/admin/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ArrowLeft size={14} />
            Retour aux prospects
          </Link>
          <h1 className="text-3xl font-black text-on-surface">
            {lead.first_name} {lead.last_name || ""}
          </h1>
          <p className="text-xs text-on-surface-variant">ID Prospect : <code className="bg-surface px-2 py-0.5 rounded font-mono text-[10px]">{lead.id}</code></p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-on-surface-variant">Statut dossier :</span>
          <select
            value={statusVal}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="h-10 px-3 rounded-lg border border-outline-variant bg-white text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="new">Nouveau</option>
            <option value="qualified">Qualifié</option>
            <option value="converted_to_case">Transmis cas</option>
            <option value="exported">Exporté</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Profile & Wizard */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Card */}
          <section className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Détails du Prospect
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Adresse email</span>
                <p className="font-semibold text-on-surface flex items-center gap-1.5">
                  <Mail size={16} className="text-on-surface-variant" />
                  {lead.email || <span className="text-on-surface-variant italic">Non renseignée</span>}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Téléphone WhatsApp</span>
                <p className="font-semibold text-on-surface flex items-center gap-1.5">
                  <Phone size={16} className="text-on-surface-variant" />
                  {lead.whatsapp_phone || <span className="text-on-surface-variant italic">Non renseigné</span>}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Niveau estimé</span>
                <p className="font-black text-primary">
                  {lead.estimated_level || "À vérifier"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Objectif formation</span>
                <p className="font-semibold text-on-surface">
                  {lead.goal || "Non spécifié"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Intention du lead</span>
                <p className="font-semibold text-on-surface">
                  {LEAD_INTENT_LABELS[lead.lead_intent] || "Formation"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Type de démarche administrative</span>
                <p className="font-semibold text-on-surface text-primary">
                  {lead.partner_request_type || "Aucune"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date de RDV Préfecture</span>
                <p className="font-semibold text-on-surface">
                  {lead.date_rdv_prefecture ? new Date(lead.date_rdv_prefecture).toLocaleDateString("fr-FR") : "Aucun RDV programmé"}
                </p>
              </div>

              {lead.message && (
                <div className="sm:col-span-2 space-y-1 bg-surface p-4 rounded-2xl border border-outline-variant/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Message personnalisé</span>
                  <p className="text-on-surface font-medium leading-relaxed">{lead.message}</p>
                </div>
              )}

              {lead.attempt_id && (
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">ID Session d'évaluation</span>
                  <p className="font-mono text-xs text-on-surface bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant w-fit">
                    {lead.attempt_id}
                  </p>
                </div>
              )}

              {lead.metadata?.flags && Array.isArray(lead.metadata.flags) && lead.metadata.flags.length > 0 && (
                <div className="sm:col-span-2 space-y-1 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Alertes & Anomalies (IA/Algorithme)</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {lead.metadata.flags.map((flag: string) => (
                      <span key={flag} className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded text-[10px]">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lead.metadata?.reliability_by_level && Object.keys(lead.metadata.reliability_by_level).length > 0 && (
                <div className="sm:col-span-2 space-y-1 bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Indices de Fiabilité Pédagogique par Compétence</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 text-xs">
                    {Object.entries(lead.metadata.reliability_by_level).map(([lvl, score]: [string, any]) => (
                      <div key={lvl} className="bg-white p-2.5 rounded-lg border border-outline-variant/50 text-center shadow-sm">
                        <span className="font-bold text-outline uppercase">{lvl}</span>
                        <p className="font-extrabold text-on-surface mt-0.5">{Math.round(score * 100)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(lead.financement_opt_in || lead.metadata?.funding_profile) && (
                <div className="sm:col-span-2 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Profil financement</span>
                    <p className="mt-1 text-sm text-emerald-950">
                      Donnees declaratives collectees avant transmission au partenaire financement.
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <FundingInfo label="Statut financement" value={FUNDING_STATUS_LABELS[lead.funding_status] || lead.funding_status} />
                    <FundingInfo label="Date de naissance" value={formatDate(lead.birth_date || lead.metadata?.funding_profile?.birth_date)} />
                    <FundingInfo label="Nationalite" value={lead.nationality || lead.metadata?.funding_profile?.nationality} />
                    <FundingInfo label="Adresse" value={lead.address_line1 || lead.metadata?.funding_profile?.address_line1} />
                    <FundingInfo label="Code postal" value={lead.postal_code || lead.metadata?.funding_profile?.postal_code} />
                    <FundingInfo label="Ville" value={lead.city || lead.metadata?.funding_profile?.city} />
                    <FundingInfo label="Situation" value={lead.professional_status || lead.metadata?.funding_profile?.professional_status} />
                    <FundingInfo label="Secteur" value={lead.sector_activity || lead.metadata?.funding_profile?.sector_activity} />
                    <FundingInfo label="Compte CPF" value={lead.cpf_status || lead.metadata?.funding_profile?.cpf_status} />
                    <FundingInfo label="Solde CPF" value={formatCurrency(lead.cpf_balance_declared ?? lead.metadata?.funding_profile?.cpf_balance_declared)} />
                    <FundingInfo label="France Travail" value={lead.france_travail_registered || lead.metadata?.funding_profile?.france_travail_registered} />
                    <FundingInfo label="Soutien employeur" value={lead.employer_support || lead.metadata?.funding_profile?.employer_support} />
                    <FundingInfo label="Date cible" value={formatDate(lead.funding_target_date || lead.metadata?.funding_profile?.target_date)} />
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pilotage transmission</p>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                      L'export financement reprend uniquement les demandes consentantes marquees pretes a transmettre.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <FundingStatusButton
                        active={lead.funding_status === "to_qualify"}
                        disabled={updatingFundingStatus}
                        label="A qualifier"
                        onClick={() => handleUpdateFundingStatus("to_qualify")}
                      />
                      <FundingStatusButton
                        active={lead.funding_status === "ready_to_transmit"}
                        disabled={updatingFundingStatus || !fundingReadiness.ready}
                        label="Pret a transmettre"
                        onClick={() => handleUpdateFundingStatus("ready_to_transmit")}
                      />
                      <FundingStatusButton
                        active={lead.funding_status === "transmitted"}
                        disabled={updatingFundingStatus}
                        label="Transmis"
                        onClick={() => handleUpdateFundingStatus("transmitted")}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-emerald-200 bg-white p-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Qualification manuelle</p>
                      <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                        Notes internes et prochaine action pour garder le suivi financement lisible avant export.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Prochaine action
                        <select
                          value={fundingNextAction}
                          onChange={(event) => setFundingNextAction(event.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold normal-case tracking-normal text-on-surface outline-none focus:border-emerald-500"
                        >
                          <option value="">A definir</option>
                          <option value="call_candidate">Rappeler le candidat</option>
                          <option value="complete_profile">Completer le profil</option>
                          <option value="prepare_export">Preparer l'export</option>
                          <option value="wait_partner">Attendre le partenaire</option>
                          <option value="no_action">Aucune action</option>
                        </select>
                      </label>

                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Date de relance
                        <input
                          type="datetime-local"
                          value={fundingFollowupAt}
                          onChange={(event) => setFundingFollowupAt(event.target.value)}
                          className="mt-1 h-10 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold normal-case tracking-normal text-on-surface outline-none focus:border-emerald-500"
                        />
                      </label>
                    </div>

                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Notes internes financement
                      <textarea
                        rows={4}
                        value={fundingInternalNotes}
                        onChange={(event) => setFundingInternalNotes(event.target.value)}
                        placeholder="Ex : candidat disponible le soir, solde CPF a confirmer, rappeler apres RDV employeur..."
                        className="mt-1 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium normal-case tracking-normal text-on-surface outline-none focus:border-emerald-500"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleSaveFundingQualification}
                      disabled={savingFundingQualification}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                    >
                      {savingFundingQualification ? "Enregistrement..." : "Enregistrer le suivi financement"}
                    </button>
                  </div>

                  <div className={`rounded-xl border p-3 ${fundingReadiness.ready ? "border-emerald-200 bg-emerald-100/60" : "border-amber-200 bg-amber-50"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${fundingReadiness.ready ? "text-emerald-800" : "text-amber-800"}`}>
                      Checklist avant export
                    </p>
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      {fundingReadiness.items.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 font-bold ${
                            item.ok
                              ? "border-emerald-200 bg-white text-emerald-900"
                              : "border-amber-200 bg-white text-amber-900"
                          }`}
                        >
                          <Check size={14} className={item.ok ? "text-emerald-600" : "text-amber-300"} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                    {!fundingReadiness.ready && (
                      <p className="mt-3 text-xs font-semibold leading-relaxed text-amber-900">
                        Completez les elements manquants avant de preparer l'export partenaire.
                      </p>
                    )}
                  </div>

                  {lead.metadata?.funding_profile?.recommended_journey && (
                    <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm text-on-surface">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Parcours rattache</p>
                      <p className="mt-1 font-black">{lead.metadata.funding_profile.recommended_journey.name}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {lead.metadata.funding_profile.recommended_journey.hours}h - {lead.metadata.funding_profile.recommended_journey.exam_target} - {formatCurrency(lead.metadata.funding_profile.recommended_journey.public_price)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Wizard Manual Transmission */}
          <section className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <header className="bg-gradient-to-r from-sidebar-bg to-on-surface-variant p-6 text-white flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">RGPD & Partenaire</p>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Share2 size={20} className="text-primary-container" />
                  Orientation Expert Partenaire
                </h2>
              </div>
              <span className="text-xs bg-primary/20 border border-primary/30 px-3 py-1 rounded-full font-bold">
                Étape {wizardStep} / 5
              </span>
            </header>

            {/* Wizard Steps indicator */}
            <div className="px-6 py-4 bg-surface/50 border-b border-outline-variant/20 flex flex-wrap gap-2 text-xs font-bold text-on-surface-variant">
              {WIZARD_STEPS.map((step, idx) => {
                const active = idx + 1 === wizardStep;
                const completed = idx + 1 < wizardStep;
                return (
                  <div key={step} className="flex items-center gap-2">
                    <span className={`
                      h-5 w-5 rounded-full flex items-center justify-center font-black text-[10px]
                      ${active && "bg-primary text-white"}
                      ${completed && "bg-emerald-500 text-white"}
                      ${!active && !completed && "bg-outline-variant/30 text-on-surface-variant"}
                    `}>
                      {completed ? <Check size={10} /> : idx + 1}
                    </span>
                    <span className={active ? "text-primary font-black" : ""}>{step}</span>
                    {idx < WIZARD_STEPS.length - 1 && <ChevronRight size={12} />}
                  </div>
                );
              })}
            </div>

            {/* Wizard Body content */}
            <div className="p-6">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-on-surface">Étape 1 : Confirmer le diagnostic linguistique</h3>
                  <p className="text-sm text-on-surface-variant">
                    Avant de transférer le dossier, veuillez vérifier si les scores ou le niveau de positionnement nécessitent une requalification manuelle.
                  </p>
                  <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-on-surface-variant">Prénom :</span>
                      <span className="font-bold text-on-surface">{lead.first_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-on-surface-variant">Niveau estimé :</span>
                      <span className="font-bold text-primary">{lead.estimated_level || "A1 (par défaut)"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-sidebar-bg px-6 font-bold text-white shadow hover:opacity-90 transition-all text-sm"
                  >
                    Valider le profil & Suivant
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-on-surface">Étape 2 : Audit de conformité RGPD</h3>
                  <p className="text-sm text-on-surface-variant">
                    Pour être légalement transmis à un partenaire, le prospect doit avoir consenti au partage de ses données à des fins d'accompagnement.
                  </p>
                  
                  <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 space-y-3 text-sm">
                    <div className="flex items-center gap-2 font-bold text-emerald-600">
                      <ShieldCheck size={18} />
                      Consentement Partenaire accordé
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-on-surface-variant">Date consentement :</span>
                        <p className="font-semibold text-on-surface mt-0.5">
                          {lead.consent_timestamp ? new Date(lead.consent_timestamp).toLocaleString("fr-FR") : "Horodaté au clic"}
                        </p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">Version mentions :</span>
                        <p className="font-semibold text-on-surface mt-0.5">
                          {lead.consent_partner_text_version || "v1.0"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-white px-4 font-bold text-on-surface hover:bg-surface transition-all text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-sidebar-bg px-6 font-bold text-white shadow hover:opacity-90 transition-all text-sm"
                    >
                      RGPD Conforme & Suivant
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-on-surface">Étape 3 : Estimation Financement & CPF</h3>
                  <p className="text-sm text-on-surface-variant">
                    Estimez le reste à charge du candidat selon ses droits de formation pour adapter l'orientation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Solde CPF déclaré</span>
                      <p className="text-2xl font-black text-emerald-600 mt-1">
                        {dossier?.solde_cpf !== undefined && dossier?.solde_cpf !== null
                          ? `${dossier.solde_cpf} €`
                          : "Non renseigné"}
                      </p>
                    </div>
                    <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Reste à charge estimé</span>
                      <p className="text-2xl font-black text-on-surface mt-1">
                        {dossier?.reste_a_charge !== undefined && dossier?.reste_a_charge !== null
                          ? `${dossier.reste_a_charge} €`
                          : "À définir"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-white px-4 font-bold text-on-surface hover:bg-surface transition-all text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setWizardStep(4)}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-sidebar-bg px-6 font-bold text-white shadow hover:opacity-90 transition-all text-sm"
                    >
                      Suivant
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-on-surface">Étape 4 : Sélectionner l'organisme partenaire</h3>
                  <p className="text-sm text-on-surface-variant">
                    Choisissez le partenaire habilité qui prendra en charge l'accompagnement du dossier en préfecture.
                  </p>

                  {partners.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      Aucun partenaire actif et conforme n'est enregistré. Créez et activez un partenaire dans la section correspondante.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                      {partners.map((p) => (
                        <label 
                          key={p.id}
                          className={`
                            flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors
                            ${selectedPartnerId === p.id 
                              ? "bg-primary/5 border-primary" 
                              : "bg-surface border-outline-variant/30 hover:bg-surface-container"
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name="partner_selection"
                            value={p.id}
                            checked={selectedPartnerId === p.id}
                            onChange={() => setSelectedPartnerId(p.id)}
                            className="text-primary focus:ring-primary h-4 w-4"
                          />
                          <div className="flex-1 text-sm">
                            <p className="font-bold text-on-surface">{p.name}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">Mode : {p.transmission_mode} | Contact : {p.contact_name || "—"}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold text-on-surface">Notes internes pour la transmission (facultatif)</span>
                    <textarea
                      placeholder="Indiquez des précisions sur le dossier (urgence, horaire d'appel)..."
                      value={wizardNotes}
                      onChange={(e) => setWizardNotes(e.target.value)}
                      className="w-full h-24 rounded-lg border border-outline-variant bg-surface p-3 text-sm focus:outline-none focus:border-primary text-on-surface"
                    />
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-white px-4 font-bold text-on-surface hover:bg-surface transition-all text-sm"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleSendTransmission}
                      disabled={sendingTx || !selectedPartnerId}
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-6 font-bold text-on-primary shadow hover:opacity-90 disabled:opacity-50 transition-all text-sm"
                    >
                      {sendingTx ? "Transmission..." : "Transmettre le Dossier"}
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="text-center py-6 space-y-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
                    <UserCheck size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-on-surface">Transmission Confirmée !</h3>
                    <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                      Le prospect a bien été orienté vers le partenaire choisi. Le statut a été mis à jour et historisé.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setSelectedPartnerId("");
                      setWizardNotes("");
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-sidebar-bg px-6 font-bold text-white shadow hover:opacity-90 transition-all text-sm"
                  >
                    Fermer l'assistant
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right 1 Column: Timelines & History */}
        <div className="space-y-8">
          
          {/* Transmission History */}
          <section className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Building size={18} className="text-primary" />
              Historique des Transmissions
            </h3>

            {transmissions.length === 0 ? (
              <p className="text-xs text-on-surface-variant bg-surface p-4 rounded-2xl border border-outline-variant/20">
                Aucune transmission effectuée pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {transmissions.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl border border-outline-variant/30 bg-surface/50 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface">{t.partners?.name || "Partenaire inconnu"}</span>
                      <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-2 py-0.5 rounded uppercase text-[10px]">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-on-surface-variant font-medium">Mode : {t.transmission_mode}</p>
                    <div className="flex gap-2 text-[10px] text-on-surface-variant border-t border-outline-variant/20 pt-2 mt-2">
                      <Clock size={12} />
                      Transmis le {new Date(t.transmitted_at || t.created_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Timeline Events */}
          <section className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Journal des Événements
            </h3>

            {events.length === 0 ? (
              <p className="text-xs text-on-surface-variant bg-surface p-4 rounded-2xl border border-outline-variant/20">
                Aucun événement enregistré.
              </p>
            ) : (
              <div className="relative border-l-2 border-outline-variant/30 pl-4 space-y-6 ml-2">
                {events.map((e) => (
                  <div key={e.id} className="relative text-xs">
                    {/* Circle icon */}
                    <span className="absolute -left-[23px] top-0 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white flex items-center justify-center" />
                    
                    <div className="font-bold text-on-surface">{e.event_name}</div>
                    <div className="text-[10px] text-on-surface-variant mt-0.5">
                      {new Date(e.created_at).toLocaleString("fr-FR")}
                    </div>
                    {e.properties && Object.keys(e.properties).length > 0 && (
                      <pre className="mt-1.5 p-2 rounded bg-surface border border-outline-variant/20 overflow-x-auto text-[10px] font-mono text-on-surface-variant">
                        {JSON.stringify(e.properties, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>
    </div>
  );
}

type FundingStatus = "interested" | "to_qualify" | "ready_to_transmit" | "transmitted";
type FundingNextAction = "call_candidate" | "complete_profile" | "prepare_export" | "wait_partner" | "no_action";

const FUNDING_STATUS_LABELS: Record<string, string> = {
  not_requested: "Sans demande",
  interested: "A rappeler",
  to_qualify: "A qualifier",
  ready_to_transmit: "Pret a transmettre",
  transmitted: "Transmis",
};

const LEAD_INTENT_LABELS: Record<string, string> = {
  training: "Formation",
  training_financing: "Financement formation",
  admin_accompaniment: "Accompagnement administratif",
  training_and_admin_accompaniment: "Formation + accompagnement administratif",
};

function FundingStatusButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
        active
          ? "border-emerald-700 bg-emerald-700 text-white"
          : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function getFundingReadiness(lead: any) {
  const items = [
    { label: "Consentement partenaire financement", ok: !!lead.consent_partner },
    { label: "Prenom et nom", ok: !!lead.first_name?.trim() && !!lead.last_name?.trim() },
    { label: "Email ou WhatsApp", ok: !!lead.email?.trim() || !!lead.whatsapp_phone?.trim() },
    { label: "Objectif", ok: !!lead.goal?.trim() },
    { label: "Situation professionnelle", ok: !!lead.professional_status?.trim() },
    { label: "Statut CPF", ok: !!lead.cpf_status?.trim() },
    { label: "Statut France Travail", ok: !!lead.france_travail_registered?.trim() },
  ];

  return {
    items,
    ready: items.every((item) => item.ok),
  };
}

function FundingInfo({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{label}</span>
      <p className="mt-1 font-bold text-on-surface">{displayValue(value)}</p>
    </div>
  );
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Non renseigne";
  if (value === "yes") return "Oui";
  if (value === "no") return "Non";
  if (value === "unknown") return "A verifier";
  return String(value).replaceAll("_", " ");
}

function formatCurrency(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Non renseigne";
  return `${value.toLocaleString("fr-FR")} EUR`;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Non renseigne";
  return new Date(value).toLocaleDateString("fr-FR");
}

function toDateTimeLocalValue(value: unknown) {
  if (typeof value !== "string" || !value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
