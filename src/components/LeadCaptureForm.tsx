import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { captureBilanLead } from "@/lib/leads.functions";
import { trackEvent } from "@/lib/analytics";

interface Props {
  attemptId?: string | null;
  estimatedLevel?: string | null;
}

const LS_KEY = "bff_lead_pending";

export function LeadCaptureForm({ attemptId, estimatedLevel }: Props) {
  const submit = useServerFn(captureBilanLead);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Merci de cocher la case de consentement pour recevoir votre bilan.");
      return;
    }
    setLoading(true);
    trackEvent("lead_capture_submitted", { attempt_id: attemptId, level: estimatedLevel });

    const payload = {
      email: email.trim(),
      whatsapp_phone: whatsapp.trim(),
      consent_marketing: true as const,
      attempt_id: attemptId ?? null,
      estimated_level: estimatedLevel ?? null,
      source: "bilan_capture",
      metadata: { ua: typeof navigator !== "undefined" ? navigator.userAgent : "" },
    };

    try {
      await submit({ data: payload });
      trackEvent("lead_capture_succeeded", { attempt_id: attemptId });
      try {
        localStorage.removeItem(LS_KEY);
      } catch {}
      setSuccess(true);
    } catch (err: any) {
      console.error("Lead capture error", err);
      // Résilience : sauvegarde locale
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }));
      } catch {}
      trackEvent("lead_capture_failed", { message: err?.message });
      setError(
        "Connexion instable. Votre bilan est sauvegardé sur cet appareil — nous le renverrons dès que possible.",
      );
      setSuccess(true); // afficher la confirmation malgré tout
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-primary-container/10 p-8 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h3 className="text-2xl font-bold text-on-surface">Bilan en route !</h3>
        <p className="text-on-surface-variant">
          Vérifiez votre boîte mail (et les spams). Vous y trouverez votre bilan complet, le guide pratique et
          vos pistes de financement personnalisées.
        </p>
        {error && <p className="text-sm text-on-surface-variant italic">{error}</p>}
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
          Bilan détaillé + guide pratique + pistes de financement, envoyés en quelques minutes. 100% gratuit,
          sans engagement, sans appel obligatoire.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="lead-email">
            Email <span className="text-secondary">*</span>
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full h-[52px] px-4 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-on-surface text-sm" htmlFor="lead-wa">
            WhatsApp <span className="text-on-surface-variant font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
            <input
              id="lead-wa"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="w-full h-[52px] pl-11 pr-4 rounded-lg border border-outline bg-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Canal de confort si vous souhaitez recevoir une copie sur WhatsApp.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-container transition-colors">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 accent-primary shrink-0"
          />
          <span className="text-sm text-on-surface-variant">
            J'accepte de recevoir mon bilan, le guide pratique et des informations sur les financements. Je peux
            me désinscrire à tout moment. Voir notre{" "}
            <Link to="/confidentialite" className="underline text-primary">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>

        {error && (
          <p className="text-sm text-error bg-error-container/20 border border-error/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !consent}
          className="w-full h-[58px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md
            bg-secondary text-on-secondary hover:opacity-95 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#f97316", color: "white" }}
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
            </>
          )}
        </button>

        <p className="text-[11px] text-on-surface-variant/80 leading-relaxed text-center">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
          Information importante : aucune garantie de prise en charge financière ne peut être donnée avant
          étude individuelle de votre dossier auprès des organismes financeurs (CPF, OPCO, France Travail,
          employeur). Le bilan envoyé est indicatif et ne se substitue pas à un examen officiel.
        </p>
      </form>
    </div>
  );
}
