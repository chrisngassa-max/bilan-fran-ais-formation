import { useState, useEffect } from "react";
import { Wallet, Building2, Handshake, Briefcase, Info, ArrowRight } from "lucide-react";
import { SituationPro } from "../types/leads";
import { NiveauIndicatif } from "../types/bilan";
import { Link } from "@tanstack/react-router";
import { Tooltip } from "./Tooltip";
import { trackCPFClic } from "../utils/tracking";
import { Button } from "@/components/bff/Button";

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

  const prefilledParams = new URLSearchParams()
  prefilledParams.append("situation_pro", situation)
  const prefillQuery = prefilledParams.toString() ? `?${prefilledParams.toString()}` : ""

  const ctaLabels: Record<SituationPro, { label: string; id: string }> = {
    salarie: { label: "Vérifier mon éligibilité CPF gratuitement", id: "btn-financement-action-salarie" },
    demandeur: { label: "Demander une simulation France Travail", id: "btn-financement-action-demandeur" },
    independant: { label: "Simuler mes droits de financement FAF", id: "btn-financement-action-independant" },
    sans_activite: { label: "Consulter un conseiller en financement", id: "btn-financement-action-sans-activite" },
  };

  const situationContent: Record<SituationPro, { title: string; description: string }> = {
    salarie: {
      title: "Financement Salarié (Compte Personnel de Formation & OPCO)",
      description:
        "Vos droits cumulés sur votre Compte Personnel de Formation (CPF) et les budgets de formation de votre entreprise (OPCO) peuvent être mobilisés pour couvrir partiellement ou totalement les frais pédagogiques de votre formation de français de référence.",
    },
    demandeur: {
      title: "Aide Individuelle à la Formation (AIF)",
      description:
        "France Travail (anciennement Pôle Emploi) propose des dispositifs d'aide individuelle pour financer votre apprentissage du français dans le cadre de votre projet d'insertion ou de reconversion professionnelle.",
    },
    independant: {
      title: "Fonds d'Assurance Formation (FAF)",
      description:
        "En tant que travailleur indépendant, libéral ou auto-entrepreneur, vous cotisez annuellement à un FAF (FIFPL, AGEFICE, FAFPM...). Vous disposez de budgets annuels de formation spécifiques.",
    },
    sans_activite: {
      title: "Financements Régionaux & Co-financements",
      description:
        "Des dispositifs de soutien portés par votre Conseil Régional, votre Mairie ou les caisses d'allocations familiales (CAF) peuvent être sollicités selon votre situation personnelle et familiale.",
    },
  };

  const content = situationContent[situation];
  const cta = ctaLabels[situation];

  return (
    <div className="bg-surface-bright rounded-3xl border border-outline-variant p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2.5 rounded-xl">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-black text-on-surface">Options & Dispositifs de Financement</h3>
      </div>

      <div className="mb-6 space-y-3">
        <label className="block text-xs font-bold text-outline uppercase tracking-wider">
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
                : 'border-outline-variant/50 hover:border-outline-variant text-on-surface-variant bg-surface-container/50'
              }`}
            >
              <s.icon className="h-5 w-5 shrink-0" />
              <span className="text-xs sm:text-sm">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-surface-container border border-outline-variant rounded-2xl space-y-4">
        <div className="space-y-2">
          <h4 className="font-extrabold text-on-surface text-base">{content.title}</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed font-semibold">{content.description}</p>
        </div>
        <Button variant="primary" size="md" asChild className="w-full font-bold text-sm">
          <Link
            to={`/accompagnement-administratif${prefillQuery}`}
            onClick={() => handleCtaClick(situation === "demandeur" || situation === "sans_activite" ? "aide_conseiller" : "solde")}
            id={cta.id}
          >
            {cta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-[10px] text-outline font-bold uppercase tracking-wider text-center leading-relaxed">
        Paiements échelonnés en plusieurs fois sans frais complémentaires disponibles · Aucun engagement requis.
      </p>
    </div>
  );
}
