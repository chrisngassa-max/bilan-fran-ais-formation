import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Loader2, ShieldAlert, ShieldCheck, UserCheck, PhoneCall, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { siteName } from "@/config/site";
import { track } from "@/utils/tracking-plausible";
import { ChecklistDocuments, DemarcheType } from "../components/ChecklistDocuments";
import { AlerteAttestationManquante } from "../components/AlerteAttestationManquante";
import { SituationPro } from "../types/leads";

const LS_KEY = "bff_lead_pending";
const CONSENT_VERSION = "v1.0";

export const Route = createFileRoute("/accompagnement-administratif")({
  head: () => ({
    meta: [
      { title: `Aide au dossier préfecture — ${siteName}` },
      { property: "og:title", content: `Aide au dossier préfecture — ${siteName}` },
    ],
  }),
  component: AccompagnementAdministratifPage,
});

function AccompagnementAdministratifPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [requestType, setRequestType] = useState<DemarcheType>("pluriannuelle");
  const [situationPro, setSituationPro] = useState<SituationPro>("salarie");
  const [consentPartner, setConsentPartner] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checklist tracking state
  const [checklistData, setChecklistData] = useState<{
    docs_checklist: Record<string, boolean>;
    docs_manquants: number;
    attestation_ok: boolean;
    dispense_demandee: boolean;
  } | null>(null);

  useEffect(() => {
    track("partner_page_viewed");
  }, []);

  const handleChecklistChange = (data: typeof checklistData) => {
    setChecklistData(data);
  };

  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);

  const handleDispenseClick = () => {
    setChecklistData(prev => prev ? { ...prev, dispense_demandee: true } : null);
    setDispenseModalOpen(true);
  };

  const closeDispenseModal = () => {
    setDispenseModalOpen(false);
    // Auto-scroll to the contact form to make submission seamless
    document.getElementById("lead-form-container")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("Le prénom est obligatoire.");
      return;
    }

    if (!lastName.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!whatsapp.trim()) {
      setError("Le numéro WhatsApp est obligatoire.");
      return;
    }

    // Simple international phone format check
    if (!whatsapp.trim().startsWith("+") && !whatsapp.trim().startsWith("00")) {
      setError("Format international requis, ex. +33 6 12 34 56 78");
      return;
    }

    if (!consentPartner) {
      setError("Vous devez consentir au traitement de vos données pour être recontacté(e).");
      return;
    }

    if (!consentWhatsapp) {
      setError("Vous devez accepter d'être contacté(e) par WhatsApp pour soumettre.");
      return;
    }

    setLoading(true);
    trackEvent("admin_lead_capture_submitted", { request_type: requestType });
    track("partner_lead_submitted", { request_type: requestType });

    const payload = {
      tunnel: "T1_administratif_direct",
      source: "accompagnement_admin",
      lead_intent: "admin_accompaniment",
      prenom: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || undefined,
      whatsapp: whatsapp.trim(),
      type_demarche: requestType,
      situation_pro: situationPro,
      partenaire_consent: true,
      whatsapp_consent: true,
      consent_at: new Date().toISOString(),
      demarche_inconnue: requestType === "je_ne_sais_pas",
      docs_checklist: checklistData?.docs_checklist || {},
      docs_manquants: checklistData?.docs_manquants || 0,
      attestation_ok: checklistData?.attestation_ok || false,
      dispense_demandee: checklistData?.dispense_demandee || false,
    };

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }

      trackEvent("admin_lead_capture_succeeded", { lead_id: result.lead_id });
      track("partner_lead_succeeded", { lead_id: result.lead_id ?? "" });
      setSuccess(true);
    } catch (err: any) {
      console.error("[AccompagnementAdmin] submission failed:", err);
      trackEvent("admin_lead_capture_failed", { message: err?.message || "Unknown error" });
      setError(err?.message || "Une erreur de connexion est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const isAttestationMissing = checklistData ? !checklistData.attestation_ok && !checklistData.dispense_demandee : false;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      {dispenseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispense-modal-title"
          onClick={closeDispenseModal}
        >
          <div
            className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="dispense-modal-title" className="text-xl font-black text-slate-800">
                Cas de dispense du justificatif de niveau de langue
              </h3>
              <button
                type="button"
                onClick={closeDispenseModal}
                aria-label="Fermer"
                className="text-slate-400 hover:text-slate-600 shrink-0"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liste indicative</p>
            <ul className="space-y-3 text-sm text-slate-700 font-semibold">
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                Diplôme français (brevet, CAP/BEP, bac, supérieur) attestant du niveau requis
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                État de santé (certificat médical) — dispense appréciée par la préfecture
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                Âge : situations particulières appréciées au cas par cas
              </li>
            </ul>
            <p className="text-xs text-slate-500 leading-relaxed">
              La décision appartient exclusivement à l'administration.
            </p>
            <button
              type="button"
              onClick={closeDispenseModal}
              className="w-full h-12 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl transition-all text-sm"
            >
              Faire vérifier ma situation par le partenaire →
            </button>
          </div>
        </div>
      )}
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Explanatory Content & Interactive Checklist */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-4">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ea580c]/10 text-[#ea580c] text-xs font-bold uppercase tracking-wider border border-[#ea580c]/20">
              <UserCheck className="h-4 w-4" />
              Service d'Assistance Expert Préfecture
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 leading-tight tracking-tight">
              Vous avez un dossier à déposer en préfecture ?
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed font-semibold">
              Nous collaborons avec un <span className="text-[#ea580c]">partenaire spécialisé en accompagnement administratif</span> pour sécuriser vos démarches, vérifier la conformité de vos pièces et vous éviter des mois de retard.
            </p>
          </div>

          {/* Interactive Checklist Rendering */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-800">1. Sélectionnez votre démarche</h2>
              <p className="text-xs text-slate-500 font-semibold">
                Découvrez les pièces requises en temps réel avant d'être recontacté(e).
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="demarche-select">
                  Votre démarche :
                </label>
                <select
                  id="demarche-select"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as DemarcheType)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="pluriannuelle">Carte de séjour pluriannuelle / résident</option>
                  <option value="resident_10ans">Carte de résident / 10 ans</option>
                  <option value="naturalisation">Naturalisation par décret</option>
                  <option value="je_ne_sais_pas">Je ne sais pas quelle démarche choisir</option>
                  <option value="autre">Autre démarche administrative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2" htmlFor="situation-select">
                  Votre situation pro :
                </label>
                <select
                  id="situation-select"
                  value={situationPro}
                  onChange={(e) => setSituationPro(e.target.value as SituationPro)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="salarie">Salarié(e) / CDI / CDD</option>
                  <option value="demandeur">Demandeur d'emploi</option>
                  <option value="independant">Indépendant / Auto-entrepreneur</option>
                  <option value="sans_activite">Sans activité / Autre</option>
                </select>
              </div>
            </div>

            {requestType === "je_ne_sais_pas" && (
              <div className="p-5 bg-blue-50 border-2 border-blue-100 rounded-2xl animate-fade-in my-4">
                <p className="text-sm text-blue-800 leading-relaxed font-semibold">
                  ℹ️ Pas de problème. Notre partenaire spécialisé identifie la démarche idéale selon votre profil et vous guide sur les justificatifs nécessaires.
                </p>
              </div>
            )}

            {requestType !== "je_ne_sais_pas" && requestType !== "autre" && (
              <div className="animate-fade-in">
                <ChecklistDocuments 
                  type_demarche={requestType} 
                  situation_pro={situationPro}
                  onChange={handleChecklistChange}
                  onDispenseClick={handleDispenseClick}
                />
              </div>
            )}

            {requestType === "autre" && (
              <div className="p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl my-4">
                <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                  Pour les autres types de démarches (regroupement familial, talent, étudiant...), notre partenaire effectue une étude personnalisée de vos pièces justificatives.
                </p>
              </div>
            )}

            {isAttestationMissing && requestType !== "je_ne_sais_pas" && requestType !== "autre" && (
              <div className="animate-fade-in">
                <AlerteAttestationManquante 
                  tunnel="T1" 
                  type_titre={requestType === "pluriannuelle" ? "A2" : "B1"}
                  type_demarche={requestType}
                  prenom={firstName}
                  whatsapp={whatsapp}
                  partenaire_consent={true}
                  onDispenseClick={handleDispenseClick}
                />
              </div>
            )}
          </div>

          {/* Legal Disclaimer */}
          <div className="flex gap-4 p-5 bg-amber-50/50 border-2 border-amber-100 rounded-3xl">
            <ShieldAlert className="text-amber-600 h-6 w-6 shrink-0 mt-0.5" />
            <p className="text-slate-600 text-xs leading-relaxed font-semibold">
              <strong>Avis obligatoire de non-substitution :</strong> Ce site et notre partenaire spécialisé ne remplacent ni les services de la préfecture, ni un avocat, ni un organisme certificateur officiel. Les informations affichées sont fournies à titre indicatif. La décision finale dépend exclusivement de l'administration compétente au vu de la situation personnelle de l'usager.
            </p>
          </div>
        </div>

        {/* Right Column: Lead Form Card */}
        <div className="lg:col-span-5" id="lead-form-container">
          {success ? (
            <div className="bg-white rounded-3xl border-2 border-[#ea580c]/30 bg-[#fff7ed]/20 p-8 md:p-10 text-center space-y-6 shadow-xl animate-in fade-in duration-300">
              <CheckCircle2 className="mx-auto h-16 w-16 text-[#ea580c]" />
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-800">Demande validée !</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                  Votre demande d'accompagnement a été enregistrée avec succès.<br />
                  <span className="text-[#ea580c] font-bold">Notre partenaire spécialisé vous contacte directement sur WhatsApp sous 24 h ouvrées</span> pour analyser votre dossier complet et vérifier vos dispenses possibles.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/" className="inline-flex items-center justify-center px-6 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all text-sm">
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl space-y-6">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf2f8] text-[#db2777] text-[10px] font-bold uppercase tracking-wider border border-[#fbcfe8]">
                  <PhoneCall className="h-3.5 w-3.5 animate-bounce" />
                  Rappel sous 24 h ouvrées
                </span>
                <h2 className="text-xl font-black text-slate-800 pt-2">2. Vos coordonnées de contact</h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Laissez vos coordonnées pour que le cabinet partenaire expert procède à l'évaluation de votre cas.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block font-bold mb-2 text-slate-700 text-xs uppercase tracking-wider" htmlFor="admin-firstname">
                    Votre prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="admin-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Amine"
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-[#ea580c] focus:bg-white transition-all font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2 text-slate-700 text-xs uppercase tracking-wider" htmlFor="admin-lastname">
                    Votre nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="admin-lastname"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Diallo"
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-[#ea580c] focus:bg-white transition-all font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2 text-slate-700 text-xs uppercase tracking-wider" htmlFor="admin-whatsapp">
                    Numéro WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="admin-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-[#ea580c] focus:bg-white transition-all font-bold text-sm"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider leading-relaxed">
                    Format international requis (commençant par + ou 00)
                  </p>
                </div>

                <div>
                  <label className="block font-bold mb-2 text-slate-700 text-xs uppercase tracking-wider" htmlFor="admin-email">
                    Email <span className="text-slate-400 normal-case tracking-normal">(recommandé — pour recevoir la liste de vos pièces)</span>
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-[#ea580c] focus:bg-white transition-all font-bold text-sm"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border-2 border-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      required
                      checked={consentPartner}
                      onChange={(e) => setConsentPartner(e.target.checked)}
                      className="mt-1 h-5 w-5 accent-[#ea580c] shrink-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-semibold leading-relaxed">
                      J'accepte que mes informations soient transmises au partenaire spécialisé en accompagnement administratif afin d'être recontacté pour l'analyse de mes pièces. <span className="text-red-500 font-bold">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border-2 border-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      required
                      checked={consentWhatsapp}
                      onChange={(e) => setConsentWhatsapp(e.target.checked)}
                      className="mt-1 h-5 w-5 accent-[#ea580c] shrink-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-semibold leading-relaxed">
                      J'accepte d'être recontacté par WhatsApp au sujet de ma demande d'accompagnement. <span className="text-red-500 font-bold">*</span>
                    </span>
                  </label>
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center pt-2">
                  En validant ce formulaire, vous acceptez notre{" "}
                  <Link to="/confidentialite" className="underline text-[#ea580c] hover:text-[#c2410c]">
                    politique de confidentialité
                  </Link>
                  .
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-100 rounded-xl p-4 animate-shake">
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !firstName || !lastName || !whatsapp || !consentPartner || !consentWhatsapp}
                  className="w-full h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md
                    bg-[#ea580c] text-white hover:bg-[#c2410c] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Transmission sécurisée...
                    </>
                  ) : (
                    <>
                      Demander à être contacté(e) →
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 font-semibold text-center flex items-center justify-center gap-1.5 leading-relaxed pt-2">
                  <ShieldCheck className="h-4 w-4 text-[#ea580c] shrink-0" />
                  Connexion sécurisée (HTTPS). Données protégées conformément au RGPD.
                </p>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
