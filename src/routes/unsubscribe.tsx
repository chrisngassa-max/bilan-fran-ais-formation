import { createFileRoute } from "@tanstack/react-router";
import { siteName } from "@/config/site";
import { Card } from "@/components/bff/Card";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: `Désinscription — ${siteName}` },
      { name: "description", content: "Désinscrivez-vous de nos communications." }
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  return (
    <div className="px-4 py-10 min-h-[60vh] flex items-center justify-center">
      <div className="mx-auto max-w-md w-full space-y-6">
        <Card className="text-center p-8 space-y-4">
          <h1 className="headline-md font-bold text-slate-900">Désinscription validée</h1>
          <p className="body-md text-slate-600 leading-relaxed">
            Vous avez été désinscrit(e) avec succès de nos communications par email et WhatsApp. Aucun email de relance automatique ne vous sera envoyé.
          </p>
          <p className="text-xs text-slate-400">
            Conformément aux directives de la CNIL et du RGPD, vos préférences ont été enregistrées.
          </p>
        </Card>
      </div>
    </div>
  );
}
