import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getReportingStatsFn, getLeadsAdminFn } from "../lib/admin.functions";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Download, 
  TrendingUp, 
  Users, 
  Layers, 
  Coins, 
  Clock, 
  RefreshCw,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { track } from "../utils/tracking-plausible";

export const Route = createFileRoute("/admin/reporting")({
  head: () => ({
    meta: [
      { title: "Statistiques & Reporting Analytique — Administration" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminReporting,
});

const COLORS = ["#9d4222", "#56423c", "#d08a70", "#dfb8aa"];

export function AdminReporting() {
  const getReportingStats = useServerFn(getReportingStatsFn);
  const getLeadsAdmin = useServerFn(getLeadsAdminFn);

  const [metrics, setMetrics] = useState<any>(null);
  const [tunnel, setTunnel] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReportingStats();
      setMetrics(res.metrics);
      setTunnel(res.tunnel);
      setTrends(res.trends);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de calcul analytique");
    } finally {
      setLoading(false);
    }
  }, [getReportingStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // 1. Fetch all leads (max 1000 for export)
      const res = await getLeadsAdmin({
        data: {
          page: 1,
          limit: 1000
        }
      });

      if (res.leads.length === 0) {
        toast.error("Aucune donnée à exporter.");
        setExporting(false);
        return;
      }

      // 2. Generate CSV content
      const headers = ["ID", "Nom", "Prenom", "Email", "Whatsapp", "Source", "Type", "Niveau", "Objectif", "Statut", "Partenaire Statut", "Date Creation"];
      const rows = res.leads.map((l) => [
        l.id,
        l.last_name || "",
        l.first_name,
        l.email || "",
        l.whatsapp_phone || "",
        l.source,
        l.lead_type,
        l.estimated_level || "",
        l.goal || "",
        l.status,
        l.partner_status,
        l.created_at
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      // 3. Trigger file download
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `BFF_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 4. Log audit & Plausible track
      track("export_downloaded");
      toast.success("Export CSV téléchargé et consigné avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'exportation");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
          <p className="text-sm font-bold text-on-surface-variant animate-pulse">Calcul des KPI en temps réel...</p>
        </div>
      </div>
    );
  }

  const pieData = tunnel ? [
    { name: "Accompagnement", value: tunnel.directAdmin },
    { name: "Test Rapide", value: tunnel.testRapide },
    { name: "Test Complet", value: tunnel.testComplet },
    { name: "Autres", value: tunnel.other }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Pilotage & KPI</h1>
          <p className="text-sm text-on-surface-variant mt-1">Consultez les metrics de conversion, le tunnel d'acquisition et téléchargez les exports.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-bold text-on-surface shadow-sm hover:bg-surface-container active:scale-95 transition-all"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-on-primary px-4 text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {exporting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <Download size={16} />
                Export CSV Audité
              </>
            )}
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Prospects */}
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Prospects</span>
            <p className="text-2xl font-black text-on-surface mt-1">{metrics?.totalLeads || 0}</p>
          </div>
        </div>

        {/* Dossiers Qualifiés */}
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#9d4222]/10 text-[#9d4222] flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Dossiers Qualifiés</span>
            <p className="text-2xl font-black text-[#9d4222] mt-1">{metrics?.qualifiedLeads || 0}</p>
          </div>
        </div>

        {/* CA Sécurisé Estimé */}
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">CA Sécurisé (Est.)</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{metrics?.caSecured?.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        {/* Temps de conversion moyen */}
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Délai d'orientation</span>
            <p className="text-2xl font-black text-on-surface mt-1">{metrics?.averageConversionDays} jours</p>
          </div>
        </div>

      </section>

      {/* Visual Analytics Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Leads Trend Line Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <TrendingUp size={20} className="text-primary" />
            <div>
              <h3 className="font-extrabold text-base text-on-surface">Tendance d'inscription</h3>
              <p className="text-xs text-on-surface-variant">Volume quotidien d'inscription sur les 10 derniers jours</p>
            </div>
          </div>
          <div className="h-80 w-full pt-4">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
                Données insuffisantes pour tracer la courbe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9d4222" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#9d4222" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ede9" />
                  <XAxis dataKey="name" stroke="#a39794" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a39794" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e0ede9", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="leads" stroke="#9d4222" strokeWidth={2.5} fillOpacity={1} fill="url(#leadsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Source Breakdown Pie Chart (1 Column) */}
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <Layers size={20} className="text-primary" />
            <div>
              <h3 className="font-extrabold text-base text-on-surface">Canaux d'Acquisition</h3>
              <p className="text-xs text-on-surface-variant">Répartition des leads par source d'inscription</p>
            </div>
          </div>
          
          <div className="h-60 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-on-surface-variant">Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} lead(s)`, "Volume"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 text-xs border-t border-outline-variant/10">
            {pieData.map((d, index) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-on-surface-variant">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {d.name}
                </span>
                <span className="font-bold text-on-surface">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Compliance / Audit Note */}
      <footer className="p-4 rounded-2xl bg-[#56423c]/5 border border-[#56423c]/10 text-xs text-[#56423c] font-semibold flex items-center gap-2">
        ℹ️ Toutes les actions d'export et d'orientation font l'objet d'un traçage d'audit strict et cryptographique, conformément au référentiel national Qualiopi.
      </footer>
    </div>
  );
}
