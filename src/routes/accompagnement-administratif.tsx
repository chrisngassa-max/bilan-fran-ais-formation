import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Loader2, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { siteName } from "@/config/site";
import { track } from "@/utils/tracking-plausible";

const LS_KEY = "bff_lead_pending";
const CONSENT_VERSION = "v1.0";

export const Route = createFileRoute("/accompagnement-administratif")({
  head: () => ({
    meta: [{ title: `${siteName} — Accompagnement Administratif Préfectoral` }],
  }),
  component: AccompagnementAdministratifPage,
});

function AccompagnementAdministratifPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [requestType, setRequestType] = useState("carte_sejour");
  const [message, setMessage] = useState("");
  const [consentPartner, setConsentPartner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-retry offline leads stored in localStorage
  useEffect(() => {
    const retryOfflineLeads = async () => {
      try {
        const stored = localStorage.getItem(LS_KEY);
        if (!stored) return;

        const payload = JSON.parse(stored);
        console.log("[AccompagnementAdmin] Attempting to auto-retry stored lead:", payload);

        const response = await fetch("/api/capture-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log("[AccompagnementAdmin] Stored lead successfully sent, clearing localStorage.");
          localStorage.removeItem(LS_KEY);
        }
      } catch (err) {
        console.warn("[AccompagnementAdmin] Auto-retry of stored lead failed:", err);
      }
    };

    retryOfflineLeads();
    const interval = setInterval(retryOfflineLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    track("partner_page_viewed");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("Le prénom est obligatoire.");
      return;
    }

    if (!email.trim()) {
      setError("L'adresse email est obligatoire.");
      return;
    }

    if (!consentPartner) {
      setError("Vous devez accepter d'être contacté(e) par un expert partenaire pour soumettre le formulaire.");
      return;
    }

    setLoading(true);
    trackEvent("admin_lead_capture_submitted", { request_type: requestType });
    track("partner_lead_submitted", { request_type: requestType });

    const payload = {
      source: "accompagnement_admin" as const,
      lead_type: "admin_support" as const,
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      email: email.trim(),
      whatsapp_phone: whatsapp.trim() || undefined,
      partner_request_type: requestType,
      message: message.trim() || undefined,
      consent_training: false,
      consent_partner: true,
      consent_training_text_version: CONSENT_VERSION,
      consent_partner_text_version: CONSENT_VERSION,
      consent_timestamp: new Date().toISOString(),
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
      try {
        localStorage.removeItem(LS_KEY);
      } catch {}
      setSuccess(true);
    } catch (err: any) {
      console.error("[AccompagnementAdmin] submission failed, saving to localStorage:", err);

      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }));
      } catch {}

      trackEvent("admin_lead_capture_failed", { message: err?.message || "Unknown error" });
      track("partner_lead_failed", { message: err?.message || "Unknown error" });
      setError(
        "Connexion instable. Votre demande a été sauvegardée localement sur votre appareil. Nous réessaierons de l'envoyer automatiquement d'ici quelques instants."
      );
      setSuccess(true); // Afficher quand même le succès car la donnée est préservée localement
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4 md:px-8">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Explanatory Content */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-4">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <UserCheck className="h-4 w-4" />
              Service d'Assistance Expert
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-on-surface leading-tight tracking-tight">
              Besoin d'aide pour votre dossier en préfecture ?
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed">
              Nous travaillons avec un cabinet conseil expert sélectionné en démarches administratives pour les étrangers en France. Laissez vos coordonnées — nous vous recontactons pour analyser votre dossier.
            </p>
          </div>

          <div className="bg-surface-bright rounded-2xl p-6 md:p-8 border border-outline-variant shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-on-surface">Présentation du service d'accompagnement :</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Vérification de la conformité de votre dossier</h3>
                  <p className="text-on-surface-variant text-sm">Contrôle complet des pièces requises pour éviter les rejets immédiats en préfecture.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Identification des documents manquants</h3>
                  <p className="text-on-surface-variant text-sm">Diagnostic précis des justificatifs manquants selon votre situation professionnelle et familiale.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Accompagnement selon votre type de démarche</h3>
                  <p className="text-on-surface-variant text-sm">Suivi personnalisé que ce soit pour une première demande, un renouvellement ou une naturalisation.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Conseil sur les cas de dispense possibles</h3>
                  <p className="text-on-surface-variant text-sm">Analyse des dispenses de test de langue ou d'autres justificatifs légaux dont vous pourriez bénéficier.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              📂 Public concerné
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2 bg-surface-container/40 p-3 rounded-lg border border-outline-variant/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Carte de séjour pluriannuelle
              </div>
              <div className="flex items-center gap-2 bg-surface-container/40 p-3 rounded-lg border border-outline-variant/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Carte de résident / 10 ans
              </div>
              <div className="flex items-center gap-2 bg-surface-container/40 p-3 rounded-lg border border-outline-variant/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Naturalisation par décret
              </div>
              <div className="flex items-center gap-2 bg-surface-container/40 p-3 rounded-lg border border-outline-variant/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                Autre démarche administrative
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl">
            <ShieldAlert className="text-error h-6 w-6 shrink-0 mt-0.5" />
            <p className="text-on-surface-variant text-sm leading-relaxed italic">
              <strong>Avis de non-responsabilité :</strong> Ce service est fourni par un cabinet d'accompagnement conseil externe indépendant. Il ne remplace ni les services de la préfecture, ni les conseils d'un avocat spécialisé. Les informations fournies sont indicatives et la décision finale d'octroi de titre ou de nationalité appartient exclusivement à l'administration française compétente.
            </p>
          </div>
        </div>

        {/* Right Column: Form Card */}
        <div className="lg:col-span-5">
          {success ? (
            <div className="bg-surface-bright rounded-2xl border-2 border-primary/30 bg-primary-container/10 p-8 md:p-10 text-center space-y-6 shadow-lg animate-in fade-in duration-300">
              <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-on-surface">Demande enregistrée !</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Votre demande d'accompagnement a bien été enregistrée.<br />
                  Un conseiller du cabinet partenaire expert vous recontactera très prochainement par email ou par téléphone pour faire le point sur votre dossier.
                </p>
              </div>
              {error && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {error}
                </p>
              )}
              <div className="pt-4">
                <Link to="/" className="inline-flex items-center justify-center px-6 h-12 bg-surface-container-highest text-on-surface font-bold rounded-lg border border-outline-variant hover:bg-surface-variant transition-colors">
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface-bright rounded-2xl border border-outline-variant p-6 md:p-8 shadow-xl space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold text-on-surface">Être recontacté(e)</h2>
                <p className="text-on-surface-variant text-sm">
                  Remplissez ce formulaire d'analyse initiale de dossier.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="admin-firstname">
                      Prénom <span className="text-secondary">*</span>
                    </label>
                    <input
                      id="admin-firstname"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Amine"
                      className="w-full h-11 px-3 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-base"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="admin-lastname">
                      Nom de famille
                    </label>
                    <input
                      id="admin-lastname"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Kadi"
                      className="w-full h-11 px-3 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="admin-email">
                    Adresse e-mail <span className="text-secondary">*</span>
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amine.kadi@exemple.com"
                    className="w-full h-11 px-3 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="admin-whatsapp">
                    Numéro WhatsApp <span className="text-on-surface-variant font-normal text-xs">(Optionnel)</span>
                  </label>
                  <input
                    id="admin-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full h-11 px-3 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="admin-request-type">
                    Type de démarche visée <span className="text-secondary">*</span>
                  </label>
                  <select
                    id="admin-request-type"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-base appearance-none"
                  >
                    <option value="carte_sejour">Carte de séjour pluriannuelle</option>
                    <option value="resident">Carte de résident / 10 ans</option>
                    <option value="naturalisation">Naturalisation par décret</option>
                    <option value="je_ne_sais_pas">Je ne sais pas encore</option>
                    <option value="autre">Autre démarche administrative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="admin-message">
                    Votre situation <span className="text-on-surface-variant font-normal text-xs">(Optionnel)</span>
                  </label>
                  <textarea
                    id="admin-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez brièvement votre situation (facultatif)"
                    className="w-full p-3 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-base"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-surface-container rounded-xl border border-dashed border-outline-variant">
                    <input
                      type="checkbox"
                      required
                      checked={consentPartner}
                      onChange={(e) => setConsentPartner(e.target.checked)}
                      className="mt-1 h-5 w-5 accent-primary shrink-0"
                    />
                    <span className="text-xs text-on-surface-variant leading-relaxed">
                      J'accepte d'être recontacté(e) et accompagné(e) gratuitement par le cabinet conseil externe partenaire sélectionné pour l'analyse de mon dossier préfectoral. <span className="text-secondary font-bold">*</span>
                    </span>
                  </label>
                </div>

                <div className="text-[11px] text-on-surface-variant text-center leading-normal">
                  En demandant à être contacté, vous reconnaissez avoir lu et accepté notre{" "}
                  <Link to="/confidentialite" className="underline text-primary font-bold hover:text-primary-variant transition-colors">
                    politique de confidentialité
                  </Link>
                  .
                </div>

                {error && !success && (
                  <p className="text-sm text-error bg-error-container/20 border border-error/30 rounded-lg p-3">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !firstName || !consentPartner}
                  className="w-full h-[54px] rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md
                    bg-secondary text-on-secondary hover:opacity-95 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#ea580c", color: "white" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Demande en cours...
                    </>
                  ) : (
                    <>
                      Demander à être contacté(e) →
                    </>
                  )}
                </button>

                <p className="text-[10px] text-on-surface-variant/80 text-center leading-relaxed flex items-center justify-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  Vos données sont chiffrées et protégées conformément au RGPD.
                </p>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
