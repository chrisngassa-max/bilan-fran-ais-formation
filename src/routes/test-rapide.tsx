import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Clock, CheckCircle2, Loader2, AlertCircle, Calendar } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ChecklistDocuments } from "@/components/ChecklistDocuments";
import { AlerteAttestationManquante } from "@/components/AlerteAttestationManquante";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/test-rapide")({
  head: () => ({
    meta: [
      { title: `Test de français gratuit en 3 minutes — ${siteName}` },
      { name: "description", content: "Estimez votre niveau de français en 3 minutes. Test de positionnement gratuit et indicatif." },
      { property: "og:title", content: `Test de français gratuit en 3 minutes — ${siteName}` },
    ],
  }),
  component: TestRapidePage,
});

// ─── Questions ───────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1, text: "Comment dit-on 'hello' en français ?", options: ["Bonjour", "Merci", "Au revoir", "Bonsoir"], correct: 0, niveau: "A1" },
  { id: 2, text: "Complétez : 'Je ___ français.'", options: ["parle", "parles", "parlons", "parlez"], correct: 0, niveau: "A1" },
  { id: 3, text: "Quel article convient ? '___ maison est grande.'", options: ["La", "Le", "Les", "Un"], correct: 0, niveau: "A2" },
  { id: 4, text: "Conjuguez : 'Hier, nous ___ au cinéma.'", options: ["sommes allés", "allons", "irons", "allaient"], correct: 0, niveau: "A2" },
  { id: 5, text: "Choisissez la bonne réponse : 'Il fait beau, ___ on sort.'", options: ["donc", "mais", "pourtant", "cependant"], correct: 0, niveau: "B1" },
  { id: 6, text: "Transformez : 'On a construit ce pont.' → passif", options: ["Ce pont a été construit", "Ce pont était construit", "Ce pont sera construit", "Ce pont s'est construit"], correct: 0, niveau: "B1" },
  { id: 7, text: "Quel mot s'emploie pour nuancer ? 'Ce film est ___ bon.'", options: ["plutôt", "tellement", "si", "aussi"], correct: 0, niveau: "B1" },
  { id: 8, text: "Complétez : 'Bien qu'il ___ fatigué, il a continué.'", options: ["soit", "est", "était", "serait"], correct: 0, niveau: "B2" },
  { id: 9, text: "Sens figuré : 'Casser les pieds' signifie :", options: ["Ennuyer", "Blesser", "Courir", "Danser"], correct: 0, niveau: "B2" },
  { id: 10, text: "Registre soutenu : Quel mot remplace 'utiliser' ?", options: ["Employer", "Mettre", "Faire", "Prendre"], correct: 0, niveau: "B2" },
];

function calculerNiveau(score: number): string {
  if (score <= 2) return "A1";
  if (score <= 4) return "A2";
  if (score <= 7) return "B1";
  return "B2";
}

function calculerFormule(joursRestants: number): string {
  if (joursRestants <= 14) return "Express 20h";
  if (joursRestants <= 30) return "Intensif 40h";
  if (joursRestants <= 60) return "Standard 60h";
  return "Confort 80h";
}

function differenceEnJours(dateStr: string): number {
  const rdv = new Date(dateStr);
  const today = new Date();
  return Math.max(0, Math.round((rdv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

// ─── Phase : Intro ────────────────────────────────────────────────────────────
function PhaseIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h1 className="text-2xl font-black text-slate-900 text-center">Estimez votre niveau de français</h1>
          <ul className="space-y-3 text-sm font-semibold text-slate-700">
            <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> 10 questions — environ 3 minutes</li>
            <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Les 4 compétences sont survolées</li>
            <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> À la fin : votre niveau estimé + votre bilan complet par email</li>
            <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> Résultat indicatif, sans valeur officielle</li>
          </ul>
          <button
            onClick={onStart}
            className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
          >
            Commencer le test <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phase : Test ─────────────────────────────────────────────────────────────
const TEST_PROGRESS_KEY = "bff_quickscan_progress";

function PhaseTest({ onFinish }: { onFinish: (score: number, duration: number) => void }) {
  // Reprise sur reload : on restaure la progression depuis sessionStorage
  const restored = (() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = sessionStorage.getItem(TEST_PROGRESS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [current, setCurrent] = useState<number>(restored?.current ?? 0);
  const [answers, setAnswers] = useState<number[]>(restored?.answers ?? []);
  const startRef = useRef(restored?.startedAt ?? Date.now());

  // Persiste la progression à chaque changement (reprise à la question en cours)
  useEffect(() => {
    sessionStorage.setItem(
      TEST_PROGRESS_KEY,
      JSON.stringify({ current, answers, startedAt: startRef.current })
    );
  }, [current, answers]);

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers, idx];
    if (current + 1 >= QUESTIONS.length) {
      const score = newAnswers.filter((a, i) => a === QUESTIONS[i].correct).length;
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      sessionStorage.removeItem(TEST_PROGRESS_KEY);
      onFinish(score, duration);
    } else {
      setAnswers(newAnswers);
      setCurrent(current + 1);
    }
  };

  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Question {current + 1} / {QUESTIONS.length}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~3 min</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <p className="text-lg font-black text-slate-900">{q.text}</p>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left px-5 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-primary hover:bg-primary/5 font-bold text-sm text-slate-800 transition-all active:scale-[0.98]"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase : Capture Contact ──────────────────────────────────────────────────
function PhaseCapture({ onSubmit }: {
  onSubmit: (data: { prenom: string; email: string; whatsapp: string; rdv_prevu: boolean }) => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rdvPrevu, setRdvPrevu] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplir depuis sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("bff_candidate_info");
    if (saved) {
      try {
        const info = JSON.parse(saved);
        if (info.prenom) setPrenom(info.prenom);
        if (info.whatsapp) setWhatsapp(info.whatsapp);
      } catch {}
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prenom.trim()) { setError("Le prénom est obligatoire."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Veuillez saisir une adresse email valide."); return; }
    if (rdvPrevu === null) { setError("Veuillez indiquer si vous avez un rendez-vous prévu."); return; }
    if (!consent) { setError("Vous devez accepter la politique de confidentialité pour recevoir votre bilan."); return; }
    setError(null);
    onSubmit({ prenom: prenom.trim(), email: email.trim(), whatsapp: whatsapp.trim(), rdv_prevu: rdvPrevu });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900">Votre niveau estimé est prêt ✅</h1>
          <p className="text-slate-500 text-sm font-semibold">Indiquez votre email pour recevoir votre bilan détaillé.</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prénom *</label>
              <input type="text" required value={prenom} onChange={e => setPrenom(e.target.value)}
                placeholder="Amine" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white font-bold text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="amine@email.com" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white font-bold text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">WhatsApp (optionnel)</label>
              <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                placeholder="+33 6 12 34 56 78" className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white font-bold text-sm transition-all" />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Avez-vous un rendez-vous en préfecture prévu ? *</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRdvPrevu(true)}
                  className={`h-11 rounded-xl border-2 font-bold text-sm transition-all ${rdvPrevu === true ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200"}`}>
                  Oui
                </button>
                <button type="button" onClick={() => setRdvPrevu(false)}
                  className={`h-11 rounded-xl border-2 font-bold text-sm transition-all ${rdvPrevu === false ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200"}`}>
                  Non
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-primary shrink-0"
              />
              <span className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                J'accepte de recevoir mon bilan par email et la{" "}
                <Link to="/confidentialite" className="underline text-primary">politique de confidentialité</Link>.
                Vos données ne sont jamais vendues à des tiers.
              </span>
            </label>

            {error && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

            <button type="submit"
              className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md">
              Voir mon estimation <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Phase : Résultat rdv_prevu = true (FormuleExpress) ──────────────────────
function PhaseFormuleExpress({ score, prenom, email, whatsapp, onCaptureLead }: {
  score: number; prenom: string; email: string; whatsapp: string; onCaptureLead: (extra: object) => void;
}) {
  const niveau = calculerNiveau(score);
  const [dateRdv, setDateRdv] = useState("");
  const [typeTitre, setTypeTitre] = useState("B1");
  const [checklistData, setChecklistData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const joursRestants = dateRdv ? differenceEnJours(dateRdv) : 90;
  const formule = calculerFormule(joursRestants);
  const isAttestationMissing = checklistData ? !checklistData.attestation_ok && !checklistData.dispense_demandee : false;

  const handleCTA = async () => {
    setLoading(true);
    await onCaptureLead({ date_rdv_prefecture: dateRdv, type_titre_vise: typeTitre, formule_calculee: formule, rdv_prevu: true, niveau_estime: niveau, score_brut: score });
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-6 shadow-sm">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900">Bilan envoyé !</h2>
          <p className="text-slate-500 text-sm font-semibold">Vous recevrez votre estimation de niveau et votre plan de formation par email sous peu.</p>
          <Link to="/" className="block w-full h-12 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Badge niveau */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Estimation automatique — indicatif</p>
          <div className="w-24 h-24 rounded-full bg-slate-900 text-primary flex flex-col items-center justify-center mx-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Niveau</span>
            <span className="text-4xl font-black">{niveau}</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold italic">Ce résultat ne remplace pas une certification officielle (TCF, DELF, TEF).</p>
        </div>

        {/* Formule express */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Votre rendez-vous</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date du rendez-vous en préfecture</label>
              <input type="date" value={dateRdv} onChange={e => setDateRdv(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary font-bold text-sm transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Titre visé</label>
              <select value={typeTitre} onChange={e => setTypeTitre(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:border-primary font-bold text-sm transition-all appearance-none">
                <option value="A2">Carte de séjour pluriannuelle (indicatif A2 — à vérifier)</option>
                <option value="B1">Carte de résident / 10 ans (indicatif B1)</option>
                <option value="B2">Nationalité française (B2)</option>
                <option value="je_ne_sais_pas">Je ne sais pas encore</option>
              </select>
            </div>
          </div>

          {dateRdv && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Formule recommandée</p>
              <p className="text-2xl font-black text-slate-900">{formule}</p>
              <p className="text-xs text-slate-500 mt-1">{joursRestants} jours avant votre rendez-vous</p>
            </div>
          )}
        </div>

        {/* Checklist */}
        {typeTitre !== "je_ne_sais_pas" && (
          <details className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <summary className="px-8 py-5 font-black text-slate-900 cursor-pointer hover:bg-slate-50">📋 Voir ma checklist de documents</summary>
            <div className="px-8 pb-8">
              <ChecklistDocuments type_demarche={typeTitre === "B2" ? "naturalisation" : typeTitre === "A2" ? "pluriannuelle" : "resident_10ans"} onChange={setChecklistData} />
            </div>
          </details>
        )}

        {isAttestationMissing && (
          <AlerteAttestationManquante tunnel="T2" type_titre={typeTitre === "A2" ? "A2" : "B1"} type_demarche={typeTitre === "A2" ? "pluriannuelle" : "resident_10ans"} prenom={prenom} whatsapp={whatsapp} partenaire_consent={false} onDispenseClick={() => {}} />
        )}

        <button onClick={handleCTA} disabled={loading}
          className="w-full h-14 bg-primary text-on-primary font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:opacity-95 active:scale-95 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><ArrowRight className="h-5 w-5" /> Démarrer ma formation</>}
        </button>
      </div>
    </div>
  );
}

// ─── Phase : Résultat rdv_prevu = false (ResultatNiveau) ─────────────────────
function PhaseResultatNiveau({ score, prenom, whatsapp, onCaptureLead }: {
  score: number; prenom: string; whatsapp: string; onCaptureLead: (extra: object) => void;
}) {
  const niveau = calculerNiveau(score);
  const [submitted, setSubmitted] = useState(false);

  const handleCTA = async () => {
    await onCaptureLead({ rdv_prevu: false, niveau_estime: niveau, score_brut: score });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-6 shadow-sm">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900">Bilan envoyé !</h2>
          <p className="text-slate-500 text-sm font-semibold">Votre estimation et plan de formation arrivent par email.</p>
          <Link to="/formations" className="block w-full h-12 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center">Voir les formations</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Estimation automatique — indicatif</p>
          <div className="w-24 h-24 rounded-full bg-slate-900 text-primary flex flex-col items-center justify-center mx-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Niveau</span>
            <span className="text-4xl font-black">{niveau}</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold italic">Ce résultat ne remplace pas une certification officielle (TCF, DELF, TEF).</p>
          <button onClick={handleCTA}
            className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            Voir les formations adaptées <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3">
          <p className="font-black text-slate-800">Vous avez un dossier préfecture en cours ?</p>
          <p className="text-sm text-slate-600">Notre partenaire spécialisé peut vérifier vos pièces et détecter d'éventuelles dispenses.</p>
          <Link to="/accompagnement-administratif"
            className="inline-flex items-center gap-2 h-10 px-5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all">
            Faire vérifier mon dossier <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
type Phase = "intro" | "test" | "capture" | "express" | "niveau";

function TestRapidePage() {
  // Reprise sur reload : si une progression existe, on saute l'intro
  const hasProgress = typeof window !== "undefined" && !!sessionStorage.getItem(TEST_PROGRESS_KEY);
  const [phase, setPhase] = useState<Phase>(hasProgress ? "test" : "intro");
  const [score, setScore] = useState(0);
  const [duration, setDuration] = useState(0);
  const [contact, setContact] = useState({ prenom: "", email: "", whatsapp: "", rdv_prevu: false });

  const handleStart = () => {
    trackEvent("test_rapide_started");
    setPhase("test");
  };

  const handleTestFinish = (s: number, d: number) => {
    setScore(s);
    setDuration(d);
    setPhase("capture");
    trackEvent("test_rapide_completed", { score: s, duration: d });
  };

  const handleCapture = (data: { prenom: string; email: string; whatsapp: string; rdv_prevu: boolean }) => {
    setContact(data);
    // Persist for downstream forms
    sessionStorage.setItem("bff_candidate_info", JSON.stringify({ prenom: data.prenom, whatsapp: data.whatsapp }));
    setPhase(data.rdv_prevu ? "express" : "niveau");
    trackEvent("test_rapide_contact_submitted", { rdv_prevu: data.rdv_prevu });
  };

  const handleCaptureLead = async (extra: object) => {
    try {
      await fetch("/api/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tunnel: "T2_test_rapide",
          source: "test_rapide",
          prenom: contact.prenom,
          email: contact.email,
          whatsapp: contact.whatsapp,
          partenaire_consent: false,
          whatsapp_consent: !!contact.whatsapp,
          consent_at: new Date().toISOString(),
          ...extra,
        }),
      });
    } catch (err) {
      console.error("[TestRapide] capture-lead error:", err);
    }
  };

  if (phase === "intro") return <PhaseIntro onStart={handleStart} />;
  if (phase === "test") return <PhaseTest onFinish={handleTestFinish} />;
  if (phase === "capture") return <PhaseCapture onSubmit={handleCapture} />;
  if (phase === "express") return <PhaseFormuleExpress score={score} prenom={contact.prenom} email={contact.email} whatsapp={contact.whatsapp} onCaptureLead={handleCaptureLead} />;
  return <PhaseResultatNiveau score={score} prenom={contact.prenom} whatsapp={contact.whatsapp} onCaptureLead={handleCaptureLead} />;
}
