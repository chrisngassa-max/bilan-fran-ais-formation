import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdvisorsWorkloadFn, toggleUserRoleFn } from "../lib/admin.functions";
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw,
  Clock,
  Layers
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Équipe & Rôles de Conseillers — Administration" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminUsers,
});

export function AdminUsers() {
  const getAdvisorsWorkload = useServerFn(getAdvisorsWorkloadFn);
  const toggleUserRole = useServerFn(toggleUserRoleFn);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdvisorsWorkload();
      setUsers(res);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de chargement de l'équipe");
    } finally {
      setLoading(false);
    }
  }, [getAdvisorsWorkload]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      await toggleUserRole({ data: { userId, currentRole } });
      toast.success("Rôle utilisateur mis à jour avec succès !");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Équipe Conseillers</h1>
          <p className="text-sm text-on-surface-variant mt-1">Supervisez la charge de travail et accordez les privilèges d'administration.</p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
          Actualiser
        </button>
      </header>

      {/* Users Table */}
      <section className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
            <p className="text-sm font-bold text-on-surface-variant animate-pulse">Chargement de l'équipe...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant bg-white space-y-2">
            <p className="font-extrabold text-lg">Aucun conseiller trouvé</p>
            <p className="text-sm">Rapprochez-vous de Supabase Auth pour créer des comptes utilisateurs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant/20 text-xs uppercase font-extrabold text-on-surface-variant tracking-wider">
                  <th className="px-6 py-4">Utilisateur / ID</th>
                  <th className="px-6 py-4">Rôle Système</th>
                  <th className="px-6 py-4">Dossiers Actifs</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface text-base flex items-center gap-2">
                        <Users size={16} className="text-primary" />
                        {u.email}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-1">
                        UUID : <code className="bg-surface px-1.5 py-0.5 rounded font-mono">{u.id}</code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border
                        ${u.role === "admin" 
                          ? "bg-red-50 text-red-700 border-red-200" 
                          : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      `}>
                        <ShieldCheck size={12} />
                        {u.role === "admin" ? "Administrateur" : "Conseiller"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-on-surface text-lg">{u.activeDossiers}</span>
                        <span className="text-xs text-on-surface-variant uppercase tracking-wider">dossiers en cours</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className={`
                          inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold shadow-sm active:scale-95 transition-all
                          ${u.role === "admin" 
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }
                        `}
                      >
                        {u.role === "admin" ? (
                          <>
                            <ArrowDownCircle size={14} /> Dégrader Conseiller
                          </>
                        ) : (
                          <>
                            <ArrowUpCircle size={14} /> Promouvoir Admin
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
