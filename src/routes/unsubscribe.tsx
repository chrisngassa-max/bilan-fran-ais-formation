import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { siteName } from "@/config/site";
import { Card } from "@/components/bff/Card";
import { Button } from "@/components/bff/Button";
import { unsubscribeLeadFn } from "@/lib/leads.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: `Désinscription — ${siteName}` },
      { name: "description", content: "Désinscrivez-vous de nos communications." }
    ],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await unsubscribeLeadFn({ email: email.trim() });
      setSubmitted(true);
      toast.success("Désinscription prise en compte.");
    } catch (err: any) {
      console.error("[UnsubscribePage] Error unsubscribing:", err);
      setError(err?.message || "Une erreur est survenue lors de votre désinscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-10 min-h-[60vh] flex items-center justify-center">
      <div className="mx-auto max-w-md w-full space-y-6">
        {submitted ? (
          <Card className="text-center p-8 space-y-4">
            <h1 className="headline-md font-bold text-slate-900">Désinscription validée</h1>
            <p className="body-md text-slate-600 leading-relaxed">
              L'adresse e-mail <strong>{email}</strong> a été désinscrite avec succès de nos communications par e-mail et WhatsApp.
            </p>
            <p className="text-xs text-slate-400">
              Conformément aux directives de la CNIL et du RGPD, vos préférences ont été enregistrées en base de données.
            </p>
          </Card>
        ) : (
          <Card className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="headline-md font-bold text-slate-900">Se désinscrire</h1>
              <p className="body-md text-slate-600">
                Saisissez votre e-mail pour ne plus recevoir nos communications automatiques (résultats de tests, relances, etc.).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="unsubscribe-email" className="block label-caps text-on-surface-variant mb-1">
                  Adresse E-mail
                </label>
                <input
                  id="unsubscribe-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  className="min-h-14 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 body-md text-on-surface focus:border-primary disabled:opacity-50"
                  placeholder="Ex : candidat@email.com"
                  required
                />
                {error && (
                  <p className="mt-1 body-md text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full flex justify-center items-center gap-2"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Se désinscrire
              </Button>
            </form>

            <p className="text-xs text-center text-slate-400">
              Cette action est immédiate et irréversible. Pour vous réabonner, vous devrez soumettre une nouvelle demande.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
