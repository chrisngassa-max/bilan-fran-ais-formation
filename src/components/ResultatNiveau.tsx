import { CheckCircle2, ArrowRight, Info, ShieldCheck, Clock, Wallet } from "lucide-react";
import { NiveauIndicatif } from "@/types/bilan";
import { getRecommendedJourney } from "@/data/pricing";
import { Link } from "@tanstack/react-router";
import { Tooltip } from "@/components/Tooltip";

interface Props {
  niveau_estime: NiveauIndicatif;
  score_brut: number;
  prenom: string;
}

export function ResultatNiveau({
  niveau_estime,
  prenom,
}: Props) {
  const journey = getRecommendedJourney(niveau_estime);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl border border-outline-variant p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-bl-full -mr-16 -mt-16"></div>
        
        <div className="mb-8">
          <CheckCircle2 className="h-12 w-12 text-secondary mb-4" />
          <h2 className="text-3xl font-black text-on-surface mb-2">Bonjour {prenom} !</h2>
          <p className="text-on-surface-variant">Votre profil a été analysé. Voici votre parcours recommandé.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center md:text-left bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Niveau estimé</label>
            <div className="flex items-baseline gap-2 justify-center md:justify-start">
              <span className="text-5xl font-black text-primary">{niveau_estime}</span>
              <span className="text-xs font-bold text-on-surface-variant uppercase">CECRL</span>
            </div>
          </div>

          <div className="md:col-span-2 p-6 bg-slate-900 text-white rounded-2xl space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-md block w-fit">
              Parcours recommandé
            </span>
            <h4 className="text-xl font-black">{journey.name}</h4>
            <p className="text-xs text-slate-300 italic">
              "{journey.objective}"
            </p>
          </div>
        </div>

        {/* Détails du Parcours & Tarification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-8">
          <div className="space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Détails pédagogiques</h5>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                {journey.hours}h de formation ({journey.sessions} séances)
              </li>
              <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                1 formateur référent - 6 élèves maximum
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                Objectif : {journey.examTarget}
              </li>
            </ul>
          </div>

          <div className="space-y-4 md:border-l md:border-slate-200 md:pl-6">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tarification</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-500">
                  <Tooltip content="Le prix payé si vous réglez vous-même, payable en 3 fois sans frais.">Prix public</Tooltip>
                </span>
                <span className="text-sm font-extrabold text-slate-700">{journey.publicPrice} €</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-dashed pb-2">
                <span className="text-xs font-semibold text-slate-500">
                  <Tooltip content="Le prix préférentiel lorsque vos cours sont pris en charge par un organisme (CPF, France Travail...).">Tarif financé de référence</Tooltip>
                </span>
                <span className="text-base font-extrabold text-emerald-600">{journey.financedReferencePrice} €</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-bold text-slate-900">
                  <Tooltip content="La somme restante après déduction de vos droits CPF/OPCO.">Reste à charge (RAC)</Tooltip>
                </span>
                <span className="text-lg font-black text-slate-900">{journey.monthlyInstallment} €<span className="text-[10px] font-normal text-slate-500">/mois</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons ordonnés */}
        <div className="space-y-4 pt-6 border-t border-outline-variant">
          <Link to="/accompagnement-administratif" className="block w-full">
            <button className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:opacity-95 active:scale-95 transition-all">
              <Wallet className="h-6 w-6" />
              Vérifier mon financement
              <ArrowRight className="h-6 w-6" />
            </button>
          </Link>
          
          <Link to="/contact" className="block w-full">
            <button className="w-full h-14 border-2 border-slate-900 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">
              M'inscrire au prix public - {journey.publicPrice} €
            </button>
          </Link>

          <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-wider">
            Paiement en 3 fois sans frais disponible · Zéro engagement avant éligibilité.
          </p>
        </div>

        <div className="mt-8 flex gap-3 p-4 bg-error-container/10 border border-error/20 rounded-xl">
          <Info className="h-5 w-5 text-error shrink-0" />
          <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
            Ce résultat est indicatif et ne remplace pas une certification officielle. 
            Il permet de vous orienter vers le parcours le plus adapté à votre projet administratif (résidence, nationalité).
          </p>
        </div>
      </div>
    </div>
  );
}
