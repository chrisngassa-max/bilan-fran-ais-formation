import { Clock, Send, Loader2, WifiOff } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "./bff/Button"

interface Props {
  prenom?: string;
  email?: string;
  whatsapp?: string;
  whatsappConsent?: boolean;
  partenaireConsent?: boolean;
}

type StatusState = 'idle' | 'submitting' | 'pending_offline' | 'sent';

const LS_KEY = "bff_pending_contact_humain";

export function PageContactHumain({
  prenom: initialPrenom = "",
  email: initialEmail = "",
  whatsapp: initialWhatsapp = "",
  whatsappConsent = false,
  partenaireConsent = false
}: Props) {
  const [prenom, setPrenom] = useState(initialPrenom)
  const [email, setEmail] = useState(initialEmail)
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp)
  const [status, setStatus] = useState<StatusState>('idle')

  // Auto-retry offline lead
  useEffect(() => {
    const retryPendingLead = async () => {
      try {
        const stored = localStorage.getItem(LS_KEY);
        if (!stored) return;

        const payload = JSON.parse(stored);
        console.log("[PageContactHumain] Auto-retry of stored offline lead:", payload);

        const response = await fetch("/api/capture-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log("[PageContactHumain] Stored lead sent successfully, cleaning cache.");
          localStorage.removeItem(LS_KEY);
          setStatus('sent');
        }
      } catch (err) {
        console.warn("[PageContactHumain] Auto-retry of stored lead failed:", err);
      }
    };

    retryPendingLead();
    const interval = setInterval(retryPendingLead, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    const payload = {
      tunnel: "T3_test_complet",
      source: "test_complet_alerte_vitesse_contact",
      prenom: prenom.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || undefined,
      partenaire_consent: partenaireConsent,
      whatsapp_consent: whatsapp.trim() ? whatsappConsent : false,
      consent_at: new Date().toISOString(),
      savedAt: Date.now()
    };

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erreur de soumission réseau");
      }

      localStorage.removeItem(LS_KEY);
      setStatus('sent');
    } catch (err) {
      console.error("[PageContactHumain] submission failed, caching locally:", err);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error("Failed to write to localStorage", e);
      }
      setStatus('pending_offline')
    }
  }

  if (status === 'sent') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6 bg-white rounded-3xl border border-slate-100 shadow-xl animate-fade-in">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <Send className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Demande confirmée</h2>
        <p className="text-slate-600 text-lg">Merci, un conseiller pédagogique vous contactera sous 24 h ouvrées.</p>
      </div>
    )
  }

  if (status === 'pending_offline') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6 bg-white rounded-3xl border border-amber-100 shadow-xl animate-fade-in">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <WifiOff className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Demande enregistrée localement</h2>
        <p className="text-slate-600 text-lg leading-relaxed">
          Connexion internet instable. Vos coordonnées ont été enregistrées en toute sécurité sur votre appareil (<span className="font-mono text-xs font-bold text-amber-600">savedAt: {new Date().toLocaleTimeString()}</span>).
        </p>
        <p className="text-amber-700 bg-amber-50 rounded-xl p-4 text-sm font-semibold max-w-md mx-auto border border-amber-200">
          ⚠️ Vos informations seront transmises automatiquement dès que votre connexion sera rétablie. Vous pouvez laisser cette page ouverte.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 text-center space-y-8">
        <Clock className="h-16 w-16 text-primary mx-auto animate-pulse" />
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Votre test a bien été enregistré.</h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Un conseiller expert en formation analysera vos résultats sous 24 h ouvrées pour faire le point sur votre situation et vos options de formation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="firstname" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Votre prénom</label>
              <input 
                id="firstname"
                type="text" 
                required 
                placeholder="Votre prénom" 
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full h-14 px-6 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Votre e-mail</label>
              <input 
                id="email"
                type="email" 
                required 
                placeholder="Votre email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-6 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Votre WhatsApp (optionnel)</label>
              <input 
                id="whatsapp"
                type="tel" 
                placeholder="Votre WhatsApp (optionnel)" 
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full h-14 px-6 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
              />
            </div>
          </div>
          <Button 
            disabled={status === 'submitting'}
            className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl shadow-lg mt-4 text-white"
          >
            {status === 'submitting' ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-white" /> : "Confirmer mes coordonnées"}
          </Button>
        </form>
      </div>
    </div>
  )
}
