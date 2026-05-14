import { createFileRoute } from "@tanstack/react-router";
import { EvaluationFlow } from "@/components/evaluation/EvaluationFlow";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      { title: `Évaluation Linguistique Initiale (CECRL) — ${siteName}` },
      {
        name: "description",
        content:
          "Test complet 4 compétences (CE, CO, EE, EO) inspiré du référentiel CECRL. Sauvegarde automatique, timer actif, bilan détaillé.",
      },
      { property: "og:title", content: `Évaluation experte — ${siteName}` },
      {
        property: "og:description",
        content:
          "Passez l'évaluation linguistique complète et obtenez un bilan détaillé par compétence.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EvaluationPage,
});

function EvaluationPage() {
  return <EvaluationFlow />;
}
