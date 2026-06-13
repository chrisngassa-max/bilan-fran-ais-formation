import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getCohortFn,
  updateCohortStatusFn,
  updateCohortSessionFn,
  enrollLeadFn,
} from "../lib/cohortes.functions";
import { ArrowLeft, AlertTriangle, AlertCircle, Star, Pencil, UserPlus, X } from "lucide-react";

export const Route = createFileRoute("/admin/cohortes/$cohortId")({
  head: () => ({
    meta: [
      { title: "Détail cohorte — Console Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CohortDetail,
});

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  open: "bg-blue-50 text-blue-700 border-blue-200",
  confirming: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-surface-container text-on-surface-variant border-outline-variant",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon", open: "Ouvert", confirming: "En confirmation",
  confirmed: "Confirmé", in_progress: "En cours", completed: "Terminé", cancelled: "Annulé",
};
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function CohortDetail() {
  const { cohortId } = useParams({ from: "/admin/cohortes/$cohortId" });
  const get = useServerFn(getCohortFn);
  const updateStatus = useServerFn(updateCohortStatusFn);
  const updateSession = useServerFn(updateCohortSessionFn);
  const enroll = useServerFn(enrollLeadFn);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "sessions" | "enrollments">("overview");
  const [editSession, setEditSession] = useState<any>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get({ data: { cohortId } });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [get, cohortId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
      </div>
    );
  }

  const c = data.cohort;
  const enrolled = data.enrollments.length;
  const ratio = c.max_students ? (enrolled / c.max_students) * 100 : 0;
  const belowMin = c.status === "confirming" && enrolled < c.min_students_to_confirm;

  const daysUntilStart = c.start_date
    ? Math.ceil((new Date(c.start_date).getTime() - Date.now()) / 86400000)
    : null;
  const urgentNotConfirmed = daysUntilStart !== null && daysUntilStart >= 0 && daysUntilStart < 7
    && !["confirmed", "in_progress"].includes(c.status);

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus({ data: { cohortId, status: newStatus as any } });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-outline-variant/30">
        <Link to="/admin/cohortes" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline mb-2">
          <ArrowLeft size={16} /> Retour aux cohortes
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-on-surface">
              <span className="font-mono">{c.code || "—"}</span>
              <span className="text-on-surface-variant text-xl ml-3 font-bold">{c.formation_journeys?.title}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full border ${STATUS_BADGES[c.status]}`}>
              {STATUS_LABELS[c.status] || c.status}
            </span>
            <select value={c.status} onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 px-3 rounded-lg border border-outline-variant bg-white text-xs font-bold text-on-surface focus:outline-none focus:border-primary">
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant/30">
        {[
          { k: "overview", l: "Vue d'ensemble" },
          { k: "sessions", l: `Séances (${data.sessions.length})` },
          { k: "enrollments", l: `Inscrits (${enrolled})` },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
              tab === t.k ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {belowMin && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
              <p className="text-sm font-bold text-amber-900">
                Seulement {enrolled} inscrits — minimum {c.min_students_to_confirm} requis pour confirmer cette cohorte
              </p>
            </div>
          )}
          {urgentNotConfirmed && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <p className="text-sm font-bold text-red-900">
                Démarrage dans {daysUntilStart} jour(s) — la cohorte n'est pas encore confirmée
              </p>
            </div>
          )}

          <section className="rounded-3xl border border-outline-variant/30 shadow-sm bg-white p-6 space-y-5">
            <h2 className="text-xl font-bold text-on-surface">Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Info k="Parcours" v={c.formation_journeys?.title || "—"} />
              <Info k="Intensité" v={c.intensity} />
              <Info k="Démarrage" v={c.start_date ? new Date(c.start_date).toLocaleDateString("fr-FR") : "—"} />
              <Info k="Fin estimée" v={c.estimated_end_date ? new Date(c.estimated_end_date).toLocaleDateString("fr-FR") : "—"} />
              <Info k="Créneaux" v={(c.weekly_schedule || []).map((s: any) => `${DAYS[s.day]} ${s.start}-${s.end}`).join(" · ") || "—"} />
              <Info k="Visibilité" v={c.visibility} />
              <Info k="Formateur" v={c.formateur_id || "Non assigné"} />
              <Info k="Lien visio" v={c.meeting_url || "—"} />
            </div>

            <div className="pt-4 border-t border-outline-variant/20">
              <div className="flex items-center justify-between text-sm font-bold text-on-surface mb-2">
                <span>Inscrits : {enrolled} / {c.max_students}</span>
                <span className="text-xs text-on-surface-variant">Seuil : {c.min_students_to_confirm}</span>
              </div>
              <div className="h-3 bg-outline-variant/20 rounded-full overflow-hidden relative">
                <div className={`h-full rounded-full ${belowMin ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${Math.min(100, ratio)}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-on-surface/40"
                  style={{ left: `${(c.min_students_to_confirm / c.max_students) * 100}%` }} />
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "sessions" && (
        <section className="rounded-3xl border border-outline-variant/30 shadow-sm bg-white overflow-hidden">
          {data.sessions.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">Aucune séance planifiée.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface border-b border-outline-variant/20 text-xs uppercase font-extrabold text-on-surface-variant tracking-wider">
                <tr>
                  <th className="px-6 py-3">N°</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Horaires</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {data.sessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface/30">
                    <td className="px-6 py-3 font-mono font-bold text-on-surface">#{s.session_number}</td>
                    <td className="px-6 py-3 font-semibold text-on-surface">{new Date(s.session_date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-6 py-3 text-on-surface-variant">{s.start_time?.slice(0, 5)} → {s.end_time?.slice(0, 5)}</td>
                    <td className="px-6 py-3">
                      {s.session_type === "exam_blanc" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Star size={12} /> Examen blanc
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                          Cours
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">{s.status}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => setEditSession(s)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-white px-2.5 text-xs font-bold text-on-surface hover:bg-surface-container">
                        <Pencil size={12} /> Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === "enrollments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setEnrollOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary shadow-sm hover:opacity-90">
              <UserPlus size={16} /> Ajouter un inscrit
            </button>
          </div>
          <section className="rounded-3xl border border-outline-variant/30 shadow-sm bg-white overflow-hidden">
            {data.enrollments.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">Aucun inscrit pour l'instant.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-surface border-b border-outline-variant/20 text-xs uppercase font-extrabold text-on-surface-variant tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Inscrit</th>
                    <th className="px-6 py-3">Financement</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Stafy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {data.enrollments.map((e: any) => (
                    <tr key={e.id} className="hover:bg-surface/30">
                      <td className="px-6 py-3">
                        <div className="font-bold text-on-surface">{e.leads?.first_name || "—"}</div>
                        <div className="text-xs text-on-surface-variant">{e.leads?.email}</div>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant font-semibold">{e.payment_mode || "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${
                          e.status === "waiting_list" ? "bg-red-50 text-red-700 border-red-200" :
                          e.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>{e.status}</span>
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">{e.stafy_status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {editSession && (
        <EditSessionModal session={editSession} onClose={() => setEditSession(null)}
          onSave={async (patch) => {
            await updateSession({ data: { sessionId: editSession.id, ...patch } });
            setEditSession(null);
            fetchData();
          }} />
      )}

      {enrollOpen && (
        <EnrollModal onClose={() => setEnrollOpen(false)}
          onSubmit={async (email) => {
            await enroll({ data: { cohortId, email } });
            setEnrollOpen(false);
            fetchData();
          }} />
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{k}</p>
      <p className="font-semibold text-on-surface mt-0.5 break-words">{v}</p>
    </div>
  );
}

function EditSessionModal({ session, onClose, onSave }: any) {
  const [date, setDate] = useState(session.session_date);
  const [start, setStart] = useState(session.start_time?.slice(0, 5) || "");
  const [end, setEnd] = useState(session.end_time?.slice(0, 5) || "");
  const [url, setUrl] = useState(session.meeting_url || "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">Modifier la séance #{session.session_number}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Début</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Fin</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm font-semibold text-on-surface" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Lien visio</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose}
            className="inline-flex h-10 items-center px-4 rounded-xl border border-outline-variant bg-white text-sm font-bold text-on-surface hover:bg-surface-container">Annuler</button>
          <button disabled={saving} onClick={async () => {
              setSaving(true);
              await onSave({ session_date: date, start_time: start, end_time: end, meeting_url: url });
              setSaving(false);
            }}
            className="inline-flex h-10 items-center px-4 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EnrollModal({ onClose, onSubmit }: any) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">Ajouter un inscrit</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface"><X size={20} /></button>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Email du lead</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex@email.fr"
            className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:border-primary" />
        </div>
        {err && <p className="text-red-600 text-sm font-semibold">{err}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="inline-flex h-10 items-center px-4 rounded-xl border border-outline-variant bg-white text-sm font-bold text-on-surface hover:bg-surface-container">Annuler</button>
          <button disabled={submitting || !email} onClick={async () => {
              setSubmitting(true); setErr(null);
              try { await onSubmit(email); }
              catch (e: any) { setErr(e?.message || "Erreur"); }
              finally { setSubmitting(false); }
            }}
            className="inline-flex h-10 items-center px-4 rounded-xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {submitting ? "..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
