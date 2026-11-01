import { useGlobalContext } from '../contexts/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, CheckSquare, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function NervousSystem() {
  const { clients, tasks, users } = useGlobalContext();
  const navigate = useNavigate();
  const metrics = [
    { label: 'Clientes visibles', value: clients.length, icon: Users, destination: '/crm/clients' },
    { label: 'Tareas visibles', value: tasks.length, icon: CheckSquare, destination: '/crm/tasks' },
    { label: 'Usuarios visibles', value: users.length, icon: Activity, destination: '/crm/team' }
  ];
  return (
    <main className="min-h-full space-y-6 text-slate-800">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-3"><Activity className="h-6 w-6 text-slate-700" /></div><div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Kaivincia Corp</p><h1 className="text-2xl font-bold">Centro de observabilidad</h1>
          <p className="mt-1 text-sm text-slate-500">Indicadores calculados a partir de los datos disponibles para tu sesión.</p>
        </div></div>
      </header>
      <section className="grid gap-4 md:grid-cols-3">{metrics.map(metric => { const Icon = metric.icon; return (
        <button key={metric.label} onClick={() => navigate(metric.destination)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-400">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{metric.label}</span><Icon className="h-5 w-5 text-slate-500" /></div>
          <p className="mt-3 text-3xl font-bold tabular-nums">{metric.value}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">Abrir módulo <ArrowRight className="h-3 w-3" /></span>
        </button>); })}</section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div>
        <h2 className="font-semibold text-amber-900">Telemetría avanzada no conectada</h2><p className="mt-1 text-sm text-amber-800">No se muestran estimaciones de ROI, flujo de caja, latencia, salud de clientes, consumo de IA ni actividad de seguridad porque no hay fuentes verificadas configuradas.</p>
      </div></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-slate-600" /><h2 className="font-semibold">Estado de verificación</h2></div>
        <p className="mt-2 text-sm text-slate-600">Los totales reflejan los registros visibles para la sesión. No certifican el rendimiento ni la seguridad de la plataforma.</p>
      </section>
    </main>
  );
}
