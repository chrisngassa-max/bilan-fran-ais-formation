import { useState, useEffect } from "react";
import { Wallet, Building2, Handshake, Briefcase, Info, ArrowRight } from "lucide-react";
import { SituationPro } from "../types/leads";
import { NiveauIndicatif } from "../types/bilan";
import { Link } from "@tanstack/react-router";
import { Tooltip } from "./Tooltip";
import { trackCPFClic } from "../utils/tracking";

interface Props {
  formule?: string;
  niveau_estime?: NiveauIndicatif;
  situation_pro?: SituationPro;
  tunnel_origine?: "T2" | "T3" | "espace_prospect";
  onChange?: (situation: SituationPro) => void;
}

export function ModuleFinancement({
  situation_pro = "salarie",
  tunnel_origine = "T3",
  onChange
}: Props) {
  const [situation, setSituation] = useState<SituationPro>(situation_pro);

  useEffect(() => {
    setSituation(situation_pro);
  }, [situation_pro]);

  const handleSituationChange = (newSituation: SituationPro) => {
    setSituation(newSituation);
    onChange?.(newSituation);
  };

  const handleCtaClick = (etape: "solde" | "numero_copie" | "mcf_lien" | "aide_conseiller") => {
    trackCPFClic({ etape, tunnel_origine });
  };

  // Generate pre-filled search params for next steps
  const prefilledParams = new URLSearchParams()
  prefilledParams.append("situation_pro", situation)
  const prefillQuery = prefilledParams.toString() ? `?${prefilledParams.toString()}` : ""

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-black text-slate-800">Options & Dispositifs de Financement</h3>
      </div>

      {/* Selecteur de Situation */}
      <div className="mb-6 space-y-3">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Sélectionnez votre situation professionnelle :
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: "salarie", label: "Salarié(e) / CDI / CDD", icon: Building2 },
            { id: "demandeur", label: "Demandeur d'emploi", icon: Briefcase },
            { id: "independant", label: "Indépendant / Dirigeant / Auto-entrepreneur", icon: Handshake },
            { id: "sans_activite", label: "Sans activité / Autre", icon: Info },
          ].map((s) => (
            <button
              type="button"
              key={s.id}
              id={`btn-financement-tab-${s.id}`}
              onClick={() => handleSituationChange(s.id as SituationPro)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-bold transition-all text-left ${
                situation === s.id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-100 hover:border-slate-200 text-slate-600 bg-slate-50/50'
              }`}
            >
              <s.icon className="h-5 w-5 shrink-0" />
              <span className="text-xs sm:text-sm">{s.label}</span>
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
                Financement Salarié (Compte Personnel de Formation & OPCO)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Vos droits cumulés sur votre Compte Personnel de Formation (CPF) et les budgets de formation de votre entreprise (OPCO) peuvent être mobilisés pour couvrir partiellement ou totalement les frais pédagogiques de votre formation de français de référence.
              </p>
            </div>
            <Link 
              to={`/accompagnement-administratif${prefillQuery}`} 
              onClick={() => handleCtaClick("solde")}
              className="block w-full"
            >
              <button 
                type="button"
                id="btn-financement-action-salarie"
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm shadow-sm"
              >
                Vérifier mon éligibilité CPF gratuitement
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
                France Travail (anciennement Pôle Emploi) propose des dispositifs d'aide individuelle pour financer votre apprentissage du français dans le cadre de votre projet d'insertion ou de reconversion professionnelle.
              </p>
            </div>
            <Link 
              to={`/accompagnement-administratif${prefillQuery}`}
              onClick={() => handleCtaClick("aide_conseiller")}
              className="block w-full"
            >
              <button 
                type="button"
                id="btn-financement-action-demandeur"
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm shadow-sm"
              >
                Demander une simulation France Travail
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
                En tant que travailleur indépendant, libéral ou auto-entrepreneur, vous cotisez annuellement à un FAF (FIFPL, AGEFICE, FAFPM...). Vous disposez de budgets annuels de formation spécifiques.
              </p>
            </div>
            <Link 
              to={`/accompagnement-administratif${prefillQuery}`}
              onClick={() => handleCtaClick("solde")}
              className="block w-full"
            >
              <button 
                type="button"
                id="btn-financement-action-independant"
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm shadow-sm"
              >
                Simuler mes droits de financement FAF
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}

        {situation === "sans_activite" && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-base">Financements Régionaux & Co-financements</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Des dispositifs de soutien portés par votre Conseil Régional, votre Mairie ou les caisses d'allocations familiales (CAF) peuvent être sollicités selon votre situation personnelle et familiale.
              </p>
            </div>
            <Link 
              to={`/accompagnement-administratif${prefillQuery}`}
              onClick={() => handleCtaClick("aide_conseiller")}
              className="block w-full"
            >
              <button 
                type="button"
                id="btn-financement-action-sans-activite"
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all text-sm shadow-sm"
              >
                Consulter un conseiller en financement
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </div>

      <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center leading-relaxed">
        Paiements échelonnés en plusieurs fois sans frais complémentaires disponibles · Aucun engagement requis.
      </p>
    </div>
  );
}
