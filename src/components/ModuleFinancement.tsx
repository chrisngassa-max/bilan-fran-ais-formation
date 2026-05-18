import { useState } from "react";
import { Wallet, Building2, Handshake, Briefcase, Info, ArrowRight } from "lucide-react";
import { SituationPro } from "../types/leads";
import { NiveauIndicatif } from "../types/bilan";
import { Link } from "@tanstack/react-router";
import { Tooltip } from "@/components/Tooltip";

interface Props {
  formule?: string;
  niveau_estime?: NiveauIndicatif;
}

export function ModuleFinancement({}: Props) {
  const [situation, setSituation] = useState<SituationPro>("salarie");

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-xl">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-black text-slate-900">Options de Financement</h3>
      </div>

      {/* Selecteur de Situation */}
      <div className="mb-6 space-y-3">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
          Sélectionnez votre situation :
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: "salarie", label: "Salarié(e)", icon: Building2 },
            { id: "demandeur", label: "Demandeur d'emploi", icon: Briefcase },
            { id: "independant", label: "Indépendant / Dirigeant", icon: Handshake },
            { id: "sans_activite", label: "Sans activité", icon: Info },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSituation(s.id as SituationPro)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-black transition-all ${
                situation === s.id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
              }`}
            >
              <s.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content based on Situation */}
      <div className="space-y-4">
        {situation === "salarie" && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-base">
                Financement Salarié (<Tooltip content="Mon Compte Formation : l'argent gagné en travaillant pour payer vos cours.">CPF</Tooltip> & <Tooltip content="Organisme qui finance la formation des salariés et indépendants.">OPCO</Tooltip>)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Vos droits accumulés sur votre Compte Personnel de Formation (<Tooltip content="Mon Compte Formation : l'argent gagné en travaillant pour payer vos cours.">CPF</Tooltip>) et les fonds <Tooltip content="Organisme qui finance la formation des salariés et indépendants.">OPCO</Tooltip> de votre entreprise peuvent couvrir jusqu'à l'intégralité du <Tooltip content="Le prix préférentiel lorsque vos cours sont pris en charge par un organisme.">tarif financé de référence</Tooltip>.
              </p>
            </div>
            <Link to="/accompagnement-administratif" className="block w-full">
              <button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm">
                Vérifier mes droits CPF gratuitement
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}

        {situation === "demandeur" && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-base">Aide Individuelle à la Formation (AIF)</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                France Travail (anciennement Pôle Emploi) propose des dispositifs d'aide individuelle pour financer votre apprentissage du français dans le cadre de votre insertion professionnelle.
              </p>
            </div>
            <Link to="/accompagnement-administratif" className="block w-full">
              <button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm">
                Demander un devis France Travail
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}

        {situation === "independant" && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-base">Fonds d'Assurance Formation (FAF)</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                En tant que travailleur indépendant, libéral ou auto-entrepreneur, vous cotisez annuellement à un FAF (FIFPL, AGEFICE, FAFPM...). Vous avez des budgets de formation dédiés disponibles.
              </p>
            </div>
            <Link to="/accompagnement-administratif" className="block w-full">
              <button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm">
                Simuler mon financement FAF
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}

        {situation === "sans_activite" && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-base">Aides Régionales & Co-financements</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Des dispositifs d'aide de votre Conseil Régional, de votre Mairie ou de la CAF peuvent être mobilisés selon votre profil et votre projet d'intégration.
              </p>
            </div>
            <Link to="/accompagnement-administratif" className="block w-full">
              <button className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm">
                Parler à un conseiller financement
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </div>

      <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center leading-relaxed">
        Paiement en 3 fois sans frais disponible pour tous · Aucun engagement requis.
      </p>
    </div>
  );
}
