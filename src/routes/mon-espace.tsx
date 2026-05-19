import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, CheckSquare, Square, AlertTriangle } from "lucide-react";
import {
  validerMagicLinkFn,
  getEspaceProspectFn,
  updateChecklistFn,
} from "@/lib/espace-prospect.functions";

export const Route = createFileRoute("/mon-espace")({
  head: () => ({
    meta: [
      { title: "Mon espace — Suivi personnel | Bilan Français Formation" },
      {
        name: "description",
        content:
          "Votre espace personnel : niveau estimé, dossier administratif, financement et prochaines étapes.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MonEspacePage,
});

type Phase = "loading" | "erreur" | "espace";

type EspaceData = Awaited<ReturnType<typeof getEspaceProspectFn>>;

const CHECKLIST_DEMARCHE: Record<string, { id: string; label: string }[]> = {
  naturalisation: [
    { id: "cni", label: "Pièce d'identité en cours de validité" },
    { id: "titre_sejour", label: "Titre de séjour valide" },
    { id: "justif_domicile", label: "Justificatif de domicile (< 3 mois)" },
    { id: "acte_naissance", label: "Acte de naissance traduit" },
    { id: "diplome_b1", label: "Diplôme ou attestation B1 (ou demande de dispense)" },
    { id: "csc", label: "Casier judiciaire pays d'origine" },
    { id: "avis_imposition", label: "Avis d'imposition (3 dernières années)" },
  ],
  resident_10ans: [
    { id: "cni", label: "Pièce d'identité en cours de validité" },
    { id: "titre_sejour", label: "Titre de séjour actuel" },
    { id: "justif_domicile", label: "Justificatif de domicile (< 3 mois)" },
    { id: "diplome_a2", label: "Diplôme ou attestation A2" },
    { id: "avis_imposition", label: "Avis d'imposition" },
  ],
  pluriannuelle: [
    { id: "cni", label: "Pièce d'identité" },
    { id: "titre_sejour", label: "Titre de séjour actuel" },
    { id: "diplome_a2", label: "Diplôme ou attestation A2" },
    { id: "justif_domicile", label: "Justificatif de domicile (< 3 mois)" },
  ],
};

const DEMARCHE_LABEL: Record<string, string> = {
  naturalisation: "Demande de naturalisation",
  resident_10ans: "Carte de résident 10 ans",
  pluriannuelle: "Carte de séjour pluriannuelle",
  je_ne_sais_pas: "Démarche à préciser",
  autre: "Autre démarche",
};

const FINANCEMENT_INFO: Record<
  string,
  { dispositif: string; description: string }
> = {
  salarie: {
    dispositif: "CPF (Compte Personnel de Formation)",
    description:
      "Mobilisez vos heures CPF pour financer votre formation, sans avance de frais.",
  },
  demandeur: {
    dispositif: "AIF (Aide Individuelle à la Formation)",
    description:
      "France Travail peut financer tout ou partie de votre formation après validation de votre conseiller.",
  },
  independant: {
    dispositif: "CPF + FAF (Fonds d'Assurance Formation)",
    description:
      "Combinez votre CPF avec votre FAF (AGEFICE, FIF PL, FAFCEA…) selon votre activité.",
  },
  sans_activite: {
    dispositif: "Conseil Régional / CAF",
    description:
      "Des aides existent via le Conseil Régional et la CAF. Nous vous orientons vers le bon interlocuteur.",
  },
};

function formatDateFr(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function joursRestants(iso?: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function MonEspacePage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<EspaceData | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (!token) {
          if (!cancelled) setPhase("erreur");
          return;
        }
        const res = await validerMagicLinkFn({ data: { token } });
        if (!res.ok) {
          if (!cancelled) setPhase("erreur");
          return;
        }
        const espace = await getEspaceProspectFn({
          data: { lead_id: res.lead_id },
        });
        if (cancelled) return;
        setLeadId(res.lead_id);
        setData(espace);
        setChecklist(
          (espace.lead.checklist_states as Record<string, boolean>) ?? {},
        );
        setPhase("espace");
      } catch (e) {
        console.error("[mon-espace] init failed", e);
        if (!cancelled) setPhase("erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleChecklist(itemId: string) {
    if (!leadId) return;
    const next = { ...checklist, [itemId]: !checklist[itemId] };
    setChecklist(next);
    setSaving(true);
    try {
      await updateChecklistFn({
        data: { lead_id: leadId, checklist_states: next },
      });
    } catch (e) {
      console.error("[mon-espace] checklist update failed", e);
    } finally {
      setSaving(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "erreur") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-amber-700" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Lien expiré ou invalide
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Ce lien d'accès a déjà été utilisé ou a dépassé sa durée de validité
            (30 jours). Pour récupérer un nouvel accès à votre espace, refaites
            le test — un nouveau lien vous sera envoyé par email.
          </p>
          <Link
            to="/passer-test/$token"
            params={{ token: "latest" }}
            className="inline-flex items-center justify-center px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90"
          >
            Refaire le test →
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { lead, session } = data;

  const checklistItems =
    CHECKLIST_DEMARCHE[lead.type_demarche ?? ""] ??
    CHECKLIST_DEMARCHE.pluriannuelle;
  const nbCoches = checklistItems.filter((it) => checklist[it.id]).length;

  const jrs = joursRestants(lead.date_rdv_prefecture);
  const financement =
    FINANCEMENT_INFO[lead.situation_pro ?? ""] ?? FINANCEMENT_INFO.salarie;

  return (
    <div className="min-h-screen bg-[#fcfaf7] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-1">
            Bonjour {lead.prenom ?? "👋"} 👋
          </h1>
          <p className="text-primary-foreground/85 text-sm">
            Votre espace personnel de suivi
          </p>
        </div>

        {/* Dernier résultat */}
        {session && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Mon dernier résultat
            </h2>
            {session.created_at && (
              <p className="text-xs text-gray-500 mb-2">
                Test passé le {formatDateFr(session.created_at)}
              </p>
            )}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-4xl font-extrabold text-primary">
                {session.niveau_estime ?? "—"}
              </span>
              <span className="text-sm text-gray-600">niveau estimé</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-900 mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              Résultat indicatif — non officiel
            </div>
            <div>
              <Link
                to="/passer-test/$token"
                params={{ token: "latest" }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Refaire le test →
              </Link>
            </div>
          </section>
        )}

        {/* Dossier administratif */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Mon dossier administratif
          </h2>
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">Démarche :</span>{" "}
            {DEMARCHE_LABEL[lead.type_demarche ?? ""] ?? "Non précisée"}
          </p>

          {lead.date_rdv_prefecture && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                jrs !== null && jrs <= 14
                  ? "bg-red-50 border border-red-200 text-red-900"
                  : "bg-blue-50 border border-blue-200 text-blue-900"
              }`}
            >
              <p className="font-semibold">
                RDV préfecture : {formatDateFr(lead.date_rdv_prefecture)}
              </p>
              {jrs !== null && (
                <p className="text-xs mt-1">
                  {jrs <= 0
                    ? "Le rendez-vous est passé."
                    : jrs <= 14
                      ? `⚠️ Plus que ${jrs} jour${jrs > 1 ? "s" : ""} — préparez votre dossier en priorité.`
                      : `${jrs} jours restants`}
                </p>
              )}
            </div>
          )}

          <ul className="space-y-1.5">
            {checklistItems.map((item) => {
              const done = !!checklist[item.id];
              const Icon = done ? CheckSquare : Square;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleChecklist(item.id)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 text-left p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${done ? "text-primary" : "text-gray-400"}`}
                    />
                    <span
                      className={`text-sm ${done ? "text-gray-500 line-through" : "text-gray-800"}`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-xs font-semibold text-gray-600">
            {nbCoches} / {checklistItems.length} cochés
          </p>
        </section>

        {/* Financement */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Mon financement
          </h2>
          <p className="text-base font-semibold text-gray-900 mb-1">
            {financement.dispositif}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            {financement.description}
          </p>
          <Link
            to="/financement"
            className="text-sm font-semibold text-primary hover:underline"
          >
            En savoir plus sur mon financement →
          </Link>
        </section>

        {/* Prochaines étapes */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Mes prochaines étapes
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link
              to="/passer-test/$token"
              params={{ token: "latest" }}
              className="block p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition"
            >
              <p className="text-sm font-semibold text-gray-900">Refaire le test</p>
              <p className="text-xs text-gray-500 mt-1">Mettre à jour mon niveau</p>
            </Link>
            <Link
              to="/niveaux"
              className="block p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition"
            >
              <p className="text-sm font-semibold text-gray-900">Voir les formations</p>
              <p className="text-xs text-gray-500 mt-1">Trouver la bonne formule</p>
            </Link>
            <Link
              to="/contact"
              className="block p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition"
            >
              <p className="text-sm font-semibold text-gray-900">Parler à un conseiller</p>
              <p className="text-xs text-gray-500 mt-1">Échanger sur mon projet</p>
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-gray-500 pt-2">
          🔒 Vos données sont protégées. Aucun autre utilisateur ne peut accéder
          à cet espace.
        </p>
      </div>
    </div>
  );
}
