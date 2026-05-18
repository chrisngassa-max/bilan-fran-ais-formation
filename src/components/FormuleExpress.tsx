import { useState } from "react";
import { Calendar, Clock, ArrowRight, Info, ShieldCheck, Wallet } from "lucide-react";
import { NiveauIndicatif } from "@/types/bilan";
import { getRecommendedJourney } from "@/data/pricing";
import { calculerJoursRestants } from "@/utils/calcul-formule";
import { ModuleFinancement } from "./ModuleFinancement";
import { Link } from "@tanstack/react-router";

interface Props {
  niveau_estime: NiveauIndicatif;
  score_brut: number;
  prenom: string;
  whatsapp?: string;
  partenaire_consent: boolean;
}

export function FormuleExpressComponent({
  niveau_estime,
  prenom,
}: Props) {
  const [dateRdv, setDateRdv] = useState("");
  const [titreVise, setTitreVise] = useState<NiveauIndicatif>("B1");

  const jours = dateRdv ? calculerJoursRestants(dateRdv) : null;
  const journey = getRecommendedJourney(niveau_estime);

  // Pour la formule express, on double le rythme ou on augmente les séances si urgent
  const expressHours = journey.hours;
  const expressSessions = journey.sessions;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-outline-variant p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16"></div>
        
        <div className="mb-8">
          <h2 className="text-3xl font-black text-on-surface mb-2">Félicitations {prenom} !</h2>
          <p className="text-on-surface-variant">Votre profil a été analysé. Voici votre parcours express personnalisé.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Niveau estimé</label>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-primary">{niveau_estime}</span>
                <span className="text-sm font-bold text-on-surface-variant uppercase">CECRL</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Démarche visée</label>
              <select 
                value={titreVise}
                onChange={(e) => setTitreVise(e.target.value as NiveauIndicatif)}
                className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface font-bold focus:ring-2 focus:ring-primary outline-none text-slate-800"
              >
                <option value="A2">Carte de séjour pluriannuelle / résident (A2)</option>
                <option value="B1">Carte de résident 10 ans / naturalisation (B1)</option>
                <option value="B2">Expertise / Aisance professionnelle (B2)</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Date de votre RDV Préfecture</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={dateRdv}
                  onChange={(e) => setDateRdv(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-outline-variant bg-surface font-bold focus:ring-2 focus:ring-primary outline-none text-slate-800"
                />
              </div>
            </div>

            {jours !== null && (
              <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-1 text-emerald-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Alerte Délai Préfecture</span>
                </div>
                <h4 className="text-xl font-black mb-1">Votre rendez-vous est dans {jours} jours</h4>
                <p className="text-xs text-slate-300 font-medium">
                  Le parcours recommandé a été adapté pour s'insérer dans votre calendrier.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Détails Formule Express */}
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-4 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md block mb-1">
                Programme accéléré
              </span>
              <h4 className="text-xl font-black text-slate-900">FORMULE EXPRESS - {expressHours}h</h4>
            </div>
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              Rythme intensif
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Rythme intensif - jusqu'à 2 séances par jour · 1 formateur référent - 6 élèves maximum.
          </p>
          <div className="bg-white p-3 rounded-lg border border-primary/10 text-xs font-extrabold text-primary flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>Sous réserve d'un nombre minimum de 6 participants pour l'ouverture du cours.</span>
          </div>
        </div>

        {/* Bloc Tarifs Express */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-8">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prix public</span>
            <span className="text-xl font-extrabold text-slate-700">{journey.publicPrice} €</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tarif financé de référence</span>
            <span className="text-xl font-black text-emerald-600">{journey.financedReferencePrice} €</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paiement en 3 fois</span>
            <span className="text-xl font-extrabold text-slate-900">{journey.monthlyInstallment} €<span className="text-xs font-normal text-slate-500">/mois</span></span>
          </div>
        </div>

        {/* CTAs Ordonnés */}
        <div className="space-y-4 pt-8 border-t border-outline-variant">
          <Link to="/accompagnement-administratif" className="block w-full">
            <button className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:opacity-95 active:scale-95 transition-all">
              <Wallet className="h-6 w-6 shrink-0" />
              Vérifier mon financement en urgence
              <ArrowRight className="h-6 w-6" />
            </button>
          </Link>
          
          <Link to="/contact" className="block w-full">
            <button className="w-full h-14 border-2 border-slate-900 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">
              Je veux démarrer cette semaine
            </button>
          </Link>
        </div>

        <div className="mt-8 flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl">
          <Info className="h-5 w-5 text-error shrink-0" />
          <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
            Ce résultat est indicatif et ne remplace pas une certification officielle.
            La décision d'attribution du titre de séjour appartient exclusivement à la Préfecture.
          </p>
        </div>
      </div>

      <ModuleFinancement formule="express" niveau_estime={niveau_estime} />
    </div>
  );
}
