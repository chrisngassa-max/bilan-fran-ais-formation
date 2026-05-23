import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Download, FileText, Award, BookOpen } from "lucide-react";
import { getMyDocumentsFn } from "@/lib/apprenant.functions";
import { ApprenantLayout, EmptyCohortCTA, formatDateFrLong } from "@/components/apprenant/ApprenantLayout";

export const Route = createFileRoute("/mon-espace/mes-documents")({
  head: () => ({
    meta: [
      { title: "Mes documents — Espace apprenant | Bilan Français Formation" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MesDocumentsPage,
});

function MesDocumentsPage() {
  const fn = useServerFn(getMyDocumentsFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["apprenant", "mes-documents"],
    queryFn: () => fn(),
  });

  return (
    <ApprenantLayout>
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-900">
          Erreur : {(error as Error).message}
        </div>
      )}
      {data && !data.cohort && <EmptyCohortCTA />}
      {data && data.cohort && <Content data={data} />}
    </ApprenantLayout>
  );
}

function Content({ data }: { data: any }) {
  const { documents, journey } = data;
  return (
    <div className="space-y-6">
      {/* Documents pédagogiques */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Documents pédagogiques
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucun document partagé pour le moment. Vos formateurs déposeront ici les supports de cours au fur et à mesure.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((d: any, i: number) => (
              <li key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Séance n°{d.sessionNumber} · {formatDateFrLong(d.sessionDate)}
                    {d.type && <span className="ml-2 uppercase text-gray-400">{d.type}</span>}
                  </p>
                </div>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 shrink-0"
                  >
                    <Download className="w-4 h-4" /> Télécharger
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Attestations */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4" /> Attestations
        </h2>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Votre attestation de fin de formation sera disponible ici à l'issue du parcours.
        </div>
      </section>

      {/* Mon programme */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Mon programme — {journey?.title}
        </h2>
        {journey?.description ? (
          <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line">
            {journey.description}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Le programme détaillé de votre parcours sera bientôt disponible ici.
          </p>
        )}
        {journey?.level && (
          <p className="mt-4 text-xs text-gray-500">
            Niveau visé : <span className="font-semibold text-gray-700">{journey.level}</span>
          </p>
        )}
      </section>
    </div>
  );
}
