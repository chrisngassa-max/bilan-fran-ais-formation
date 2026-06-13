import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Mail, MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { track } from "@/utils/tracking-plausible";

interface Props {
  attemptId?: string | null;
  estimatedLevel?: string | null;
  flags?: string[] | null;
  reliabilityByLevel?: any;
  timeMetrics?: any;
}

const LS_KEY = "bff_lead_pending";
const CONSENT_VERSION = "v1.0";

export function LeadCaptureForm({ attemptId, estimatedLevel, flags, reliabilityByLevel, timeMetrics }: Props) {
  // Read persisted candidate details from sessionStorage
  const getSavedCandidateInfo = () => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('bff_candidate_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse bff_candidate_info", e);
      }
    }
    return null;
  };

  const savedInfo = getSavedCandidateInfo();

  const [firstName, setFirstName] = useState(savedInfo?.prenom || "");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState(savedInfo?.whatsapp || "");
  const [consentTraining, setConsentTraining] = useState(false);
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
        console.log("[LeadCaptureForm] Attempting to auto-retry stored lead:", payload);

        const response = await fetch("/api/capture-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log("[LeadCaptureForm] Stored lead successfully sent, clearing localStorage.");
          localStorage.removeItem(LS_KEY);
        }
      } catch (err) {
        console.warn("[LeadCaptureForm] Auto-retry of stored lead failed:", err);
      }
    };

    // Run immediately and then every 30 seconds
    retryOfflineLeads();
    const interval = setInterval(retryOfflineLeads, 30000);
    return () => clearInterval(interval);
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

    if (!consentTraining) {
      setError("Vous devez accepter de recevoir votre bilan pour soumettre le formulaire.");
      return;
    }

    setLoading(true);
    trackEvent("lead_capture_submitted", { attempt_id: attemptId, level: estimatedLevel });
    track("lead_capture_submitted", { attempt_id: attemptId ?? "", level: estimatedLevel ?? "" });

    const payload = {
      source: "bilan_post_result" as const,
      lead_intent: consentPartner ? ("training_and_admin_accompaniment" as const) : ("training" as const),
      first_name: firstName.trim(),
      email: email.trim(),
      whatsapp_phone: whatsapp.trim() || undefined,
      estimated_level: estimatedLevel ?? undefined,
      consent_training: consentTraining,
      consent_partner: consentPartner,
      consent_training_text_version: CONSENT_VERSION,
      consent_partner_text_version: CONSENT_VERSION,
      consent_timestamp: new Date().toISOString(),
      attempt_id: attemptId ?? undefined,
      flags: flags ?? undefined,
      reliability_by_level: reliabilityByLevel ?? undefined,
      time_metrics: timeMetrics ?? undefined,
      type_demarche: savedInfo?.type_demarche || undefined,
      date_rdv: savedInfo?.date_rdv || undefined,
    };

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }

      trackEvent("lead_capture_succeeded", { attempt_id: attemptId, lead_id: result.lead_id });
      track("lead_capture_succeeded", { attempt_id: attemptId ?? "", lead_id: result.lead_id ?? "" });
      try {
        localStorage.removeItem(LS_KEY);
      } catch {}
      setSuccess(true);
    } catch (err: any) {
      console.error("[LeadCaptureForm] submission failed, saving to localStorage:", err);
      
      // Fallback localStorage
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }));
      } catch {}

      trackEvent("lead_capture_failed", { message: err?.message || "Unknown error" });
      track("lead_capture_failed", { message: err?.message || "Unknown error" });
      setError(
        "Connexion instable. Votre bilan a été sauvegardé localement sur votre appareil. Nous réessaierons de l'envoyer automatiquement d'ici quelques instants."
      );
      setSuccess(true); // On affiche quand même le succès à l'utilisateur car sa donnée est sécurisée localement
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-primary-container/10 p-8 text-center space-y-4 animate-in fade-in duration-300">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h3 className="text-2xl font-bold text-on-surface">Bilan en route !</h3>
        <p className="text-on-surface-variant">
          Votre bilan a été envoyé à <strong>{email}</strong>.<br />
          Pensez à vérifier vos dossiers de courrier indésirable (spams). Vous y trouverez votre bilan détaillé, votre guide pratique et vos pistes de financement personnalisées.
        </p>
        {error && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-md mx-auto">
            {error}
          </p>
        )}
        <div className="rounded-xl border border-eval-orange/30 bg-eval-orange-soft p-4 text-sm text-on-surface-variant">
          <p className="font-bold text-on-surface">Vous ne souhaitez pas suivre de formation ?</p>
          <p className="mt-1">
            L'accompagnement administratif reste disponible separement pour verifier votre dossier prefecture.
          </p>
          <Link
            to="/accompagnement-administratif"
            className="mt-3 inline-flex font-bold text-eval-orange underline underline-offset-4"
          >
            Voir l'accompagnement administratif
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-bright p-6 md:p-8 shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">
          <Mail className="h-3.5 w-3.5" />
          Étape finale
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-on-surface">Recevoir mon bilan complet</h3>
        <p className="text-on-surface-variant">
          Bilan détaillé + guide pratique + pistes de financement, envoyés en quelques minutes. 100% gratuit, sans engagement, sans appel obligatoire.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="lead-firstname">
            Prénom <span className="text-secondary">*</span>
          </label>
          <input
            id="lead-firstname"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ex: Amine"
            className="w-full h-[52px] px-4 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-lg"
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="lead-email">
            Adresse e-mail <span className="text-secondary">*</span>
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full h-[52px] px-4 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-lg"
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="lead-wa">
            Numéro WhatsApp <span className="text-on-surface-variant font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
            <input
              id="lead-wa"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full h-[52px] pl-11 pr-4 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium text-lg"
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Canal facultatif si vous préférez également recevoir une copie de vos résultats par WhatsApp.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Checkbox 1: Training Consent (Required) */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-container transition-colors">
            <input
              type="checkbox"
              required
              checked={consentTraining}
              onChange={(e) => setConsentTraining(e.target.checked)}
              className="mt-1 h-5 w-5 accent-primary shrink-0"
            />
            <span className="text-sm text-on-surface-variant">
              J'accepte de recevoir mon bilan de positionnement gratuit et des informations sur les formations linguistiques par email. <span className="text-secondary font-bold">*</span>
            </span>
          </label>

          {/* Checkbox 2: Partner Consent (Optional) */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-container transition-colors border border-dashed border-outline-variant/60 rounded-xl">
            <input
              type="checkbox"
              checked={consentPartner}
              onChange={(e) => {
                const val = e.target.checked;
                setConsentPartner(val);
                track("partner_interest_checked", { checked: String(val) });
              }}
              className="mt-1 h-5 w-5 accent-primary shrink-0"
            />
            <span className="text-sm text-on-surface-variant">
              <strong>[Optionnel]</strong> J'accepte d'être contacté(e) et accompagné(e) gratuitement par un cabinet conseil externe partenaire spécialisé dans le montage de dossiers administratifs (titre de séjour, carte de résident, naturalisation).
            </span>
          </label>
        </div>

        <div className="text-xs text-on-surface-variant text-center pt-2">
          En validant ce formulaire, vous confirmez avoir pris connaissance et accepté notre{" "}
          <Link to="/confidentialite" className="underline text-primary font-medium hover:text-primary-variant transition-colors">
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
          disabled={loading || !email || !firstName || !consentTraining}
          className="w-full h-[58px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md
            bg-eval-orange text-white hover:opacity-95 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Mail className="h-5 w-5" />
              Recevoir mon bilan complet
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <p className="text-[11px] text-on-surface-variant/80 leading-relaxed text-center">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
          Information importante : aucune garantie de prise en charge financière ne peut être donnée avant étude individuelle de votre dossier auprès des organismes financeurs (CPF, OPCO, France Travail, employeur). Le bilan envoyé est indicatif et ne se substitue pas à un examen officiel.
        </p>
      </form>
    </div>
  );
}
