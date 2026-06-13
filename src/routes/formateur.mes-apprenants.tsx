import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Users } from "lucide-react";
import { getMesApprenantsFn } from "@/lib/formateur.functions";

export const Route = createFileRoute("/formateur/mes-apprenants")({
  component: MesApprenantsPage,
});

function tauxColor(t: number | null) {
  if (t === null) return "bg-surface-container text-on-surface-variant";
  if (t >= 80) return "bg-green-100 text-green-800";
  if (t >= 60) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function MesApprenantsPage() {
  const getApprenants = useServerFn(getMesApprenantsFn);
  const { data, isLoading } = useQuery({
    queryKey: ["formateur-apprenants"],
    queryFn: () => getApprenants(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-on-surface">Mes apprenants</h1>
        <p className="text-sm font-bold text-on-surface-variant mt-1">
          Les apprenants inscrits dans vos cohortes
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm font-bold text-on-surface-variant">
            Chargement...
          </div>
        ) : !data?.apprenants.length ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 text-on-surface-variant" size={32} />
            <p className="text-sm font-bold text-on-surface-variant">
              Aucun apprenant à afficher.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-on-surface-variant uppercase text-xs font-extrabold tracking-wider">
                <tr>
                  <th className="text-left px-6 py-4">Apprenant</th>
                  <th className="text-left px-6 py-4">Cohorte</th>
                  <th className="text-left px-6 py-4">Présences</th>
                  <th className="text-left px-6 py-4">Taux</th>
                  <th className="text-left px-6 py-4">Niveau</th>
                  <th className="text-left px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.apprenants.map((a: any) => {
                  const alert = a.taux_presence !== null && a.taux_presence < 80;
                  return (
                    <tr
                      key={a.enrollment_id}
                      className="border-t border-outline-variant/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {alert && (
                            <AlertTriangle
                              size={16}
                              className="text-amber-600 shrink-0"
                            />
                          )}
                          <div>
                            <div className="font-bold text-on-surface">
                              {a.prenom || "—"}
                            </div>
                            <div className="text-xs text-on-surface-variant">
                              {a.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">
                        {a.cohort_code}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {a.seances_presentes} / {a.seances_passees}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-xs ${tauxColor(a.taux_presence)}`}
                        >
                          {a.taux_presence === null ? "—" : `${a.taux_presence}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {a.estimated_level || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full bg-surface font-bold text-xs text-on-surface">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
