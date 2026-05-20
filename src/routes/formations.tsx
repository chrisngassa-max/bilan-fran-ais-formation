import { createFileRoute, Link } from "@tanstack/react-router";
import { useFormationOffers } from "@/hooks/useFormationOffers";
import { 
  ArrowRight, 
  Clock, 
  Wallet, 
  ShieldCheck, 
  GraduationCap, 
  Check, 
  Info,
  Loader2,
  AlertCircle
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Tooltip } from "@/components/Tooltip";

export const Route = createFileRoute("/formations")({
  component: FormationsPage,
});

function FormationsPage() {
  const { data: journeys, isError: journeysError, isLoading: journeysLoading } = useFormationOffers();
  const displayJourneys = journeys || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-[1000px] mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            Parcours de Formation Certifiants
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Choisissez votre parcours de français
          </h1>
          <div className="text-base md:text-lg text-slate-600 space-y-2 leading-relaxed">
            <p className="font-semibold text-slate-800">
              Nous vous positionnons au niveau réellement sécurisé, pas au niveau espéré.
            </p>
            <p>
              C'est ce qui permet de choisir le parcours le plus pertinent pour votre objectif administratif ou professionnel.
            </p>
          </div>
        </div>

        </div>

        {journeysLoading && (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-6 text-primary" />
            <span className="font-extrabold text-slate-800 text-lg">Chargement des offres...</span>
          </div>
        )}

        {journeysError && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h2 className="font-black text-red-900 text-xl">Catalogue indisponible</h2>
            <p className="text-red-700 font-semibold">Une erreur est survenue lors de la récupération des offres.</p>
          </div>
        )}

        {!journeysLoading && !journeysError && (
          <div className="space-y-12">
            {/* Tableau Comparatif - Desktop uniquement */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-6 font-bold text-sm uppercase tracking-wider">Parcours</th>
                  <th className="p-6 font-bold text-sm uppercase tracking-wider">Durée</th>
                  <th className="p-6 font-bold text-sm uppercase tracking-wider">
                    <Tooltip content="Le prix payé si vous réglez vous-même, payable en 3 fois sans frais.">Prix Public</Tooltip>
                  </th>
                  <th className="p-6 font-bold text-sm uppercase tracking-wider">
                    <Tooltip content="Le prix préférentiel lorsque vos cours sont pris en charge par un organisme (CPF, France Travail...).">Tarif Financé de Référence</Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayJourneys.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{j.name}</span>
                          {j.isMostRequested && (
                            <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider rounded-full">
                              Le Plus Demandé
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 block">{j.examTarget}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        {j.hours}h ({j.sessions} séances)
                      </div>
                    </td>
                    <td className="p-6 font-extrabold text-slate-900 text-base">
                      {j.publicPrice} €
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <span className="font-extrabold text-emerald-600 text-base block">
                          {j.financedReferencePrice} €
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          Selon éligibilité <Tooltip content="Mon Compte Formation : l'argent gagné en travaillant pour payer vos cours.">CPF</Tooltip>/<Tooltip content="Organisme qui finance la formation des salariés et indépendants.">OPCO</Tooltip>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Notes Sous Tableau */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Paiement en 3 fois sans frais disponible sur tous les parcours.
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                Le tarif financé de référence s'applique selon votre éligibilité.
              </p>
            </div>
            <p className="bg-slate-200/50 px-3 py-1.5 rounded-lg text-slate-600 font-bold">
              Aucun engagement avant vérification de votre situation.
            </p>
          </div>
        </div>

        {/* Vue Mobile Adaptative - Empilement de cartes fluides */}
        <div className="block md:hidden space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-t-2xl font-black text-center text-sm uppercase tracking-wider">
            Tableau des Parcours & Tarifs
          </div>
          {displayJourneys.map((j) => (
            <div key={j.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{j.name}</h3>
                  <span className="text-xs text-slate-500">{j.examTarget}</span>
                </div>
                {j.isMostRequested && (
                  <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider rounded-full">
                    Populaire
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Durée</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {j.hours}h
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prix Public</span>
                  <span className="font-extrabold text-slate-900">{j.publicPrice} €</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tarif Financé
                  </span>
                  <span className="font-black text-emerald-600 text-lg">
                    {j.financedReferencePrice} €
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CPF/OPCO éligible
                </span>
              </div>
            </div>
          ))}
          {/* Notes Sous Tableau Mobile */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs font-semibold text-slate-500">
            <p className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              Paiement en 3 fois sans frais disponible.
            </p>
            <p className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              Aucun engagement avant vérification de vos droits.
            </p>
          </div>
        </div>

        {/* Call to Actions Principaux */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/passer-test/$token"
            params={{ token: "latest" }}
            onClick={() => trackEvent("formations_cta_click", { action: "start_test" })}
            className="flex-1 max-w-sm"
          >
            <button className="w-full h-16 bg-primary text-on-primary font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-95 transition-all">
              Faire le test de positionnement gratuit
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <Link 
            to="/accompagnement-administratif"
            onClick={() => trackEvent("formations_cta_click", { action: "check_funding" })}
            className="flex-1 max-w-sm"
          >
            <button className="w-full h-16 border-2 border-slate-900 text-slate-900 font-black text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-950 hover:text-white active:scale-95 transition-all">
              <Wallet className="h-5 w-5 shrink-0" />
              Vérifier mon financement
            </button>
          </Link>
        </div>

        {/* Détails des Cartes Parcours (Bonus Recommandé) */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 text-center">Fiches détaillées des parcours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayJourneys.map((j) => (
              <div 
                key={j.id} 
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-md block mb-1.5 w-fit">
                        Niveau Visé : {j.toLevel}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900">{j.name}</h3>
                    </div>
                    {j.isMostRequested && (
                      <span className="bg-secondary/15 text-secondary text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shrink-0">
                        Populaire
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-semibold text-slate-700 italic border-l-2 border-primary/40 pl-4">
                    "{j.objective}"
                  </p>
                  
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {j.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Durée de formation</span>
                      <span className="font-extrabold text-slate-800 text-sm">{j.hours}h ({j.sessions} séances)</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cible Examen</span>
                      <span className="font-extrabold text-slate-800 text-sm">{j.examTarget}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mensualité x3</span>
                    <span className="text-2xl font-black text-slate-900">{j.monthlyInstallment} €<span className="text-xs font-normal text-slate-500">/mois</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prix Public</span>
                    <span className="font-extrabold text-slate-800 text-lg">{j.publicPrice} €</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloc Juridique / Avertissement */}
        <div className="bg-amber-50/60 text-[#7e2c0d] p-6 rounded-2xl border border-amber-200 flex gap-3">
          <Info className="h-6 w-6 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">
            <strong>Information légale :</strong> Bilan Français Formation est un organisme de formation privé. Nos parcours préparent aux examens officiels mais ne constituent pas des dispenses automatiques. Les démarches de carte de séjour et de naturalisation relèvent de la compétence exclusive de la Préfecture.
          </p>
        </div>
          </div>
        )}

      </div>
    </div>
  );
}

