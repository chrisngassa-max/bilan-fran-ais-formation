import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Calendar } from "lucide-react";
import { listCohortsFn } from "@/lib/cohortes.functions";

export const Route = createFileRoute("/formateur/mes-cohortes")({
  component: MesCohortesPage,
});

function MesCohortesPage() {
  const list = useServerFn(listCohortsFn);
  const { data, isLoading } = useQuery({
    queryKey: ["formateur-cohortes"],
    queryFn: () => list({ data: {} }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-on-surface">Mes cohortes</h1>
        <p className="text-sm font-bold text-on-surface-variant mt-1">
          Les cohortes qui vous sont assignées
        </p>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm font-bold text-on-surface-variant">
          Chargement...
        </div>
      ) : !data?.cohorts?.length ? (
        <div className="bg-white rounded-2xl border border-outline-variant p-10 text-center">
          <GraduationCap className="mx-auto mb-3 text-on-surface-variant" size={32} />
          <p className="text-sm font-bold text-on-surface-variant">
            Aucune cohorte ne vous est assignée pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.cohorts.map((c: any) => (
            <Link
              key={c.id}
              to="/admin/cohortes/$cohortId"
              params={{ cohortId: c.id }}
              className="bg-white rounded-2xl border border-outline-variant p-5 hover:border-primary transition-colors block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-primary">{c.code || "—"}</span>
                <span className="px-2 py-1 rounded-full bg-surface font-bold text-xs">
                  {c.status}
                </span>
              </div>
              <h3 className="font-bold text-on-surface mb-2">
                {c.formation_journeys?.title || "Cohorte"}
              </h3>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant font-bold">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(c.start_date).toLocaleDateString("fr-FR")}
                </span>
                <span>
                  {c.enrolled_count} / {c.max_students} apprenants
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
