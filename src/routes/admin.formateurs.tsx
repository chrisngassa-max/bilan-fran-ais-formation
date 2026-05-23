import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserPlus, Trash2, Mail, X } from "lucide-react";
import {
  getFormateursFn,
  inviterFormateurFn,
  supprimerFormateurFn,
} from "@/lib/formateurs.functions";

export const Route = createFileRoute("/admin/formateurs")({
  component: FormateursPage,
});

function FormateursPage() {
  const getFormateurs = useServerFn(getFormateursFn);
  const inviter = useServerFn(inviterFormateurFn);
  const supprimer = useServerFn(supprimerFormateurFn);
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["formateurs"],
    queryFn: () => getFormateurs(),
  });

  const inviteMut = useMutation({
    mutationFn: (e: string) => inviter({ data: { email: e } }),
    onSuccess: () => {
      setMsg({ type: "ok", text: "Invitation envoyée avec succès." });
      setEmail("");
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["formateurs"] });
    },
    onError: (e: any) => setMsg({ type: "err", text: e.message || "Erreur" }),
  });

  const deleteMut = useMutation({
    mutationFn: (uid: string) => supprimer({ data: { userId: uid } }),
    onSuccess: () => {
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["formateurs"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Formateurs</h1>
          <p className="text-sm font-bold text-on-surface-variant mt-1">
            Invitez et gérez les formateurs externes (rôle gestionnaire)
          </p>
        </div>
        <button
          onClick={() => {
            setModalOpen(true);
            setMsg(null);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} /> Inviter un formateur
        </button>
      </div>

      {msg && (
        <div
          className={`px-4 py-3 rounded-xl font-bold text-sm ${
            msg.type === "ok"
              ? "bg-green-50 text-green-900 border border-green-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm font-bold text-on-surface-variant">
            Chargement...
          </div>
        ) : !data?.formateurs.length ? (
          <div className="p-10 text-center">
            <Mail className="mx-auto mb-3 text-on-surface-variant" size={32} />
            <p className="text-sm font-bold text-on-surface-variant">
              Aucun formateur enregistré pour le moment.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-on-surface-variant uppercase text-xs font-extrabold tracking-wider">
              <tr>
                <th className="text-left px-6 py-4">Email</th>
                <th className="text-left px-6 py-4">Inscrit le</th>
                <th className="text-left px-6 py-4">Cohortes assignées</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.formateurs.map((f) => (
                <tr key={f.id} className="border-t border-outline-variant/50">
                  <td className="px-6 py-4 font-bold text-on-surface">{f.email}</td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {f.created_at
                      ? new Date(f.created_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-primary-container/40 text-primary font-bold text-xs">
                      {f.nb_cohortes} cohorte{f.nb_cohortes > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {confirmDelete === f.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteMut.mutate(f.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-surface text-on-surface rounded-lg font-bold text-xs"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(f.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-bold text-xs hover:bg-red-100"
                      >
                        <Trash2 size={14} /> Retirer l'accès
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-black text-on-surface">
                Inviter un formateur
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              Un email d'invitation sera envoyé. Le formateur devra créer son
              mot de passe via le lien reçu.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) inviteMut.mutate(email);
              }}
              className="space-y-4"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="formateur@exemple.fr"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl font-medium focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={inviteMut.isPending}
                className="w-full px-5 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                {inviteMut.isPending ? "Envoi..." : "Envoyer l'invitation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
