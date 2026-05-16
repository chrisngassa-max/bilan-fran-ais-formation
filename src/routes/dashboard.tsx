import { createFileRoute } from '@tanstack/react-router';
import { 
  BarChart3, 
  Users, 
  Target, 
  AlertTriangle, 
  Mail, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  // Mock metrics
  const stats = {
    totalLeads: 1248,
    formationLeads: 852,
    partenaireLeads: 215,
    bothLeads: 181,
    t1: 450,
    t2: 520,
    t3: 278,
    incoherent: 12,
    vitesse: 8,
    emailOpenRate: 68
  };

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Dashboard Pilotage</h1>
          <p className="text-on-surface-variant">Suivi des performances et de la qualité des leads.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-outline-variant flex items-center gap-2 text-sm font-bold">
          <Activity className="h-4 w-4 text-green-500" />
          Live Data
        </div>
      </div>

      {/* BLOC 1 — Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Formation", value: `${Math.round(stats.formationLeads/stats.totalLeads*100)}%`, icon: Target, color: "text-green-600", bg: "bg-green-50" },
          { label: "Partenaire", value: `${Math.round(stats.partenaireLeads/stats.totalLeads*100)}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Email Open Rate", value: `${stats.emailOpenRate}%`, icon: Mail, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-on-surface">{s.value}</div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOC 2 — Performance par tunnel */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-outline-variant p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Répartition par Tunnel
          </h3>
          <div className="space-y-6">
            {[
              { label: "T1 Administratif direct", value: stats.t1, total: stats.totalLeads, color: "bg-blue-500" },
              { label: "T2 Test rapide", value: stats.t2, total: stats.totalLeads, color: "bg-orange-500" },
              { label: "T3 Test complet", value: stats.t3, total: stats.totalLeads, color: "bg-purple-500" },
            ].map((t, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{t.label}</span>
                  <span>{t.value} leads ({Math.round(t.value/t.total*100)}%)</span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full ${t.color}`} style={{ width: `${(t.value/t.total)*100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOC 4 — Flags de sécurité */}
        <div className="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-error" />
            Flags Sécurité (T3)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 bg-error/5 border border-error/10 rounded-2xl">
              <div className="text-4xl font-black text-error">{stats.incoherent}</div>
              <p className="text-sm font-bold text-error/80 uppercase">Profils Incohérents</p>
            </div>
            <div className="p-6 bg-orange-50 border border-orange-200 rounded-2xl">
              <div className="text-4xl font-black text-orange-600">{stats.vitesse}</div>
              <p className="text-sm font-bold text-orange-600/80 uppercase">Alertes Vitesse</p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOC 5 — Conversions email */}
      <div className="bg-white rounded-3xl border border-outline-variant p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Séquences d'Emails Automatiques
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { day: "J+0", label: "Résultats", rate: 82, trend: "up" },
            { day: "J+3", label: "Checklist", rate: 45, trend: "down" },
            { day: "J+7", label: "Financement", rate: 38, trend: "up" },
            { day: "J+14", label: "Relance", rate: 22, trend: "up" },
          ].map((e, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-outline-variant flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-black">{e.day}</span>
                {e.trend === "up" ? <ArrowUpRight className="text-green-500" /> : <ArrowDownRight className="text-error" />}
              </div>
              <div>
                <div className="text-2xl font-black">{e.rate}%</div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">{e.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
