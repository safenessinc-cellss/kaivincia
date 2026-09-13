import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, AlertTriangle, Target, CheckCircle2, 
  ArrowRight, Activity, ShieldAlert, BarChart, XCircle
} from 'lucide-react';
import { format } from 'date-fns';

const MOCK_AUDITS = [
  { id: 'AUD-26-01', title: 'Auditoría Interna Q1', type: 'internal', status: 'completed', score: 94, findings: 2, date: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'AUD-26-02', title: 'Certificación ISO 9001:2026', type: 'external', status: 'scheduled', score: null, findings: 0, date: new Date(Date.now() + 15 * 86400000).toISOString() },
];

const MOCK_CAPAS = [
  { id: 'CAPA-042', origin: 'AUD-26-01', desc: 'Falta de registro en módulo táctico por Setters', severity: 'medium', status: 'open', owner: 'Operaciones', deadline: new Date(Date.now() + 5 * 86400000).toISOString() },
  { id: 'CAPA-043', origin: 'Incidencia #882', desc: 'Error de cálculo en facturación CRM', severity: 'critical', status: 'investigating', owner: 'IT/Finanzas', deadline: new Date(Date.now() + 1 * 86400000).toISOString() },
];

export default function AuditsSGI() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-orange-500" /> 
            Auditorías SGI <span className="text-gray-600">// CAPA TRACKER</span>
          </h1>
          <p className="text-gray-400 font-mono text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
            Gestión de Calidad, Hallazgos y Acciones Correctivas
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/5 text-gray-300 border border-white/10 px-6 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] hover:bg-white/10 transition-colors">
            Registro CAPA
          </button>
          <button className="bg-orange-500 text-black px-6 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-2 hover:bg-orange-400 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            Planificar Auditoría
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Score Calidad Global', value: '94%', icon: Activity, color: 'text-emerald-500' },
          { label: 'Auditorías Activas', value: '1', icon: Target, color: 'text-cyan-500' },
          { label: 'CAPAs Abiertas', value: '2', icon: AlertTriangle, color: 'text-orange-500' },
          { label: 'No Conformidades', value: '0', icon: ShieldAlert, color: 'text-green-500' },
        ].map((m, i) => (
          <div key={i} className="bg-[#161B22] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <m.icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity ${m.color}`} />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">{m.label}</h4>
            <div className={`text-3xl font-black italic ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Audits Section */}
        <div className="bg-[#161B22] border border-white/5 rounded-3xl p-6">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-500" /> Plan de Auditoría
              </h2>
           </div>
           
           <div className="space-y-4">
              {MOCK_AUDITS.map(audit => (
                <div key={audit.id} className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase">{audit.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          audit.type === 'internal' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-fuchsia-500/10 text-fuchsia-400'
                        }`}>
                          {audit.type}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{audit.title}</h3>
                    </div>
                    {audit.score ? (
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-500">{audit.score}%</div>
                        <div className="text-[8px] uppercase tracking-widest text-gray-500">Score</div>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded text-[10px] uppercase font-black tracking-widest">
                        Programada
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/5">
                     <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Date: {format(new Date(audit.date), 'dd/MM/yyyy')}</span>
                     <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                       {audit.findings > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                       Hallazgos: {audit.findings}
                     </span>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Corrective Actions (CAPAs) Section */}
        <div className="bg-[#161B22] border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.05)]">
           <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-sm font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Tracker CAPA (Acciones Correctivas)
              </h2>
           </div>
           
           <div className="space-y-4 relative z-10">
              {MOCK_CAPAS.map(capa => (
                <div key={capa.id} className="bg-black/60 border border-orange-500/10 rounded-2xl p-5 hover:border-orange-500/30 transition-colors">
                   <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-500 text-black uppercase tracking-widest">{capa.id}</span>
                     <span className="text-[9px] font-mono text-gray-500">Origen: {capa.origin}</span>
                   </div>
                   <p className="text-sm text-gray-200 mt-2 font-medium">{capa.desc}</p>
                   
                   <div className="grid grid-cols-3 gap-2 mt-4">
                     <div className="bg-white/5 rounded p-2 text-center border top-t border-white/5">
                       <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-1">Impacto</p>
                       <p className={`text-xs font-bold uppercase ${capa.severity === 'critical' ? 'text-red-500' : 'text-orange-400'}`}>{capa.severity}</p>
                     </div>
                     <div className="bg-white/5 rounded p-2 text-center border top-t border-white/5">
                       <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-1">Asignado</p>
                       <p className="text-xs font-bold text-gray-300">{capa.owner}</p>
                     </div>
                     <div className="bg-white/5 rounded p-2 text-center border top-t border-white/5">
                       <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-1">Deadline</p>
                       <p className="text-xs font-bold text-gray-300 font-mono">{format(new Date(capa.deadline), 'dd/MM')}</p>
                     </div>
                   </div>
                   
                   <button className="w-full mt-4 py-3 bg-white/5 hover:bg-orange-500/20 hover:text-orange-500 border border-white/5 hover:border-orange-500/50 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      Gestionar Resolución <ArrowRight className="w-3.5 h-3.5" />
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
