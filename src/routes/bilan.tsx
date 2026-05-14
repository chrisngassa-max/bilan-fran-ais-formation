import { createFileRoute } from "@tanstack/react-router";
import { Bilan } from "@/components/evaluation/Bilan";
import { siteName } from "@/config/site";

export const Route = createFileRoute("/bilan")({
  head: () => ({
    meta: [
      { title: `Bilan expert — ${siteName}` },
      {
        name: "description",
        content:
          "Votre bilan détaillé : profil par compétence, signaux de fiabilité et avis de l'expert.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BilanPage,
});

function BilanPage() {
  return <Bilan />;
}
