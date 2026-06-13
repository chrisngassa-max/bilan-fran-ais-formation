import { AlertCircle, UserCheck, ArrowRight, Loader2, CheckCircle, WifiOff } from "lucide-react"
import { ConsentementRGPD } from "./ConsentementRGPD"
import { useState, useEffect } from "react"
import { Alert } from "./ui/Alert"

interface Props {
  prenom: string
  email?: string
  whatsapp?: string
  partenaire_consent: boolean
  whatsapp_consent?: boolean
}

type StatusState = 'idle' | 'submitting' | 'pending_offline' | 'sent';

const LS_KEY = "bff_pending_resultat_incoherent";

export function ResultatIncoherent({ 
  prenom, 
  email = "", 
  whatsapp = "", 
  partenaire_consent: initialConsent,
  whatsapp_consent: initialWsConsent = false
}: Props) {
  const [consent, setConsent] = useState(initialConsent)
  const [wsConsent, setWsConsent] = useState(initialWsConsent)
  const [status, setStatus] = useState<StatusState>('idle')

  useEffect(() => {
    const retryPendingLead = async () => {
      try {
        const stored = localStorage.getItem(LS_KEY);
        if (!stored) return;

        const payload = JSON.parse(stored);
        console.log("[ResultatIncoherent] Auto-retry of stored offline lead:", payload);

        const response = await fetch("/api/capture-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log("[ResultatIncoherent] Stored lead sent successfully, cleaning cache.");
          localStorage.removeItem(LS_KEY);
          setStatus('sent');
        }
      } catch (err) {
        console.warn("[ResultatIncoherent] Auto-retry of stored lead failed:", err);
      }
    };

    retryPendingLead();
    const interval = setInterval(retryPendingLead, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRecontact = async () => {
    setStatus('submitting')
    const payload = {
      tunnel: "T3_test_complet",
      source: "test_complet_resultat_incoherent_contact",
      prenom: prenom.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim() || undefined,
      partenaire_consent: consent,
      whatsapp_consent: whatsapp.trim() ? wsConsent : false,
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
      console.error("[ResultatIncoherent] submission failed, caching locally:", err);
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
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 bg-surface-bright rounded-3xl border border-outline-variant shadow-xl animate-fade-in">
        <CheckCircle className="h-16 w-16 text-eval-success mx-auto animate-bounce" />
        <h2 className="text-3xl font-black text-on-surface">Demande enregistrée</h2>
        <p className="text-on-surface-variant text-lg">
          Merci, un conseiller expert a été notifié et vous recontactera sous 24 h ouvrées.
        </p>
      </div>
    )
  }

  if (status === 'pending_offline') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6 bg-surface-bright rounded-3xl border border-amber-200 shadow-xl animate-fade-in">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <WifiOff className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-black text-on-surface">Demande enregistrée localement</h2>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Connexion internet instable. Vos coordonnées ont été enregistrées en toute sécurité sur votre appareil (<span className="font-mono text-xs font-bold text-amber-600">savedAt: {new Date().toLocaleTimeString()}</span>).
        </p>
        <Alert variant="warning" className="max-w-md mx-auto text-left">
          Vos informations seront transmises automatiquement dès que votre connexion sera rétablie. Vous pouvez laisser cette page ouverte.
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="bg-surface-bright rounded-3xl border-2 border-error/20 shadow-xl overflow-hidden">
        <div className="bg-error-container/20 p-8 border-b border-error/10 text-center">
          <AlertCircle className="h-16 w-16 text-error mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-black text-on-surface">Bonjour {prenom}</h2>
        </div>
        
        <div className="p-8 md:p-12 space-y-8">
          <p className="text-xl text-on-surface-variant leading-relaxed text-center font-medium">
            Votre profil de compétences présente des variations de vitesse ou de réussite nécessitant une analyse personnalisée.
          </p>
          
          <div className="bg-surface-container p-6 rounded-2xl flex items-start gap-4 border border-outline-variant">
            <UserCheck className="h-8 w-8 text-primary shrink-0" />
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Un conseiller expert de notre partenaire spécialisé prendra contact sous 24 h ouvrées pour faire le point sur votre situation et vos démarches administratives.
            </p>
          </div>

          {!initialConsent && (
            <div className="pt-4">
               <ConsentementRGPD 
                show_whatsapp_consent={true}
                partenaire_consent={consent}
                whatsapp_consent={wsConsent}
                onConsentChange={(p, w) => { setConsent(p); setWsConsent(w); }}
              />
            </div>
          )}

          <button 
            disabled={!consent || status === 'submitting'}
            onClick={handleRecontact}
            className="w-full h-16 bg-primary text-on-primary rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 transition-all text-white hover:opacity-95 animate-fade-in"
          >
            {status === 'submitting' ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <>
                Être recontacté sous 24 h ouvrées
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
