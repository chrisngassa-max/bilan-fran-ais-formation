import { createFileRoute, redirect } from "@tanstack/react-router";

// L'ancien simulateur a été remplacé par le nouveau parcours en 2 étapes :
// Quick Scan (page d'accueil) → /evaluation (test complet) → /bilan.
export const Route = createFileRoute("/simulateur")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
