import { useState, useMemo, useEffect } from 'react';
import { 
  Users, Activity, DollarSign, ShieldAlert, Clock, ChevronRight, 
  Phone, CheckCircle2, Target, History, Lock, UserCircle, 
  BarChart3, Calendar, AlertTriangle, BookOpen, Star, Cpu,
  ArrowUpRight, ArrowDownRight, ShieldCheck, Zap, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IAAdvisor from '../components/IAAdvisor';
import { useGlobalContext } from '../contexts/GlobalContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Mock Data
const TEAM_MEMBERS = [
  { 
    id: '1', name: 'Carlos Ruiz', role: 'Closer', status: 'Online', workload: 95, avatar: 'C', 
    goal: 50000, current: 42000, type: 'sales', trend: 'up',
    kpis: { calls: 145, closeRate: '22%', avgCallTime: '14:30' },
    skills: [
      { name: 'Ventas B2B', level: 90, source: 'Academia Interna' },
      { name: 'Negociación', level: 85, source: 'Experiencia' },
      { name: 'Onboarding', level: 60, source: 'Academia Interna' }
    ]
  },
  { 
    id: '2', name: 'Ana Silva', role: 'Tutor', status: 'Meeting', workload: 60, avatar: 'A', 
    goal: 100, current: 85, type: 'support', trend: 'down',
    kpis: { students: 85, tickets: 120, satisfaction: '4.8/5' },
    skills: [
      { name: 'Soporte Técnico', level: 95, source: 'Experiencia' },
      { name: 'Resolución de Conflictos', level: 80, source: 'Academia Interna' },
      { name: 'Ventas B2B', level: 40, source: 'Academia Interna (En curso)' }
    ]
  },
  { 
    id: '3', name: 'Miguel Rojas', role: 'Operaciones', status: 'Offline', workload: 40, avatar: 'M', 
    goal: 10, current: 8, type: 'operations', trend: 'up',
    kpis: { projects: 8, compliance: '95%', delays: 1 },
    skills: [
      { name: 'Gestión de Proyectos', level: 100, source: 'Experiencia' },
      { name: 'Automatizaciones', level: 75, source: 'Academia Interna' }
    ]
  },
];

const AUDIT_LOGS = [
  { id: 1, user: 'Carlos Ruiz', action: 'Actualizó el contrato de TechSolutions', time: 'Hace 10 min', type: 'update' },
  { id: 2, user: 'Ana Silva', action: 'Resolvió ticket de soporte #4421', time: 'Hace 45 min', type: 'resolve' },
  { id: 3, user: 'Miguel Rojas', action: 'Intento de login fuera de horario', time: 'Ayer, 23:15', type: 'alert' },
];

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState('directory');
  const { tasks, users } = useGlobalContext();

  const members = useMemo(() => {
    if (!users || users.length === 0) return TEAM_MEMBERS;
    
    return users.map(user => {
      const mockMember = TEAM_MEMBERS.find(m => m.id === user.uid) || TEAM_MEMBERS[0];
      return {
        ...mockMember,
        id: user.uid || user.id,
        name: user.name || 'Usuario',
        role: user.role || 'Especialista',
        status: user.status === 'active' ? 'Online' : 'Offline',
        avatar: (user.name || 'U').charAt(0).toUpperCase(),
        // If it's a real user, it might not have some mock fields, let's provide defaults if missing
        goal: mockMember.goal || 100,
        current: mockMember.current || 0,
        type: mockMember.type || 'operations',
        kpis: mockMember.kpis || { projects: 0, compliance: '0%', delays: 0 },
        skills: mockMember.skills || []
      };
    });
  }, [users]);

  const [selectedMember, setSelectedMember] = useState(members[0] || TEAM_MEMBERS[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update selected member when members change if it was based on an old list
  useEffect(() => {
    if (members.length > 0) {
      const currentSelectedExists = members.find(m => m.id === selectedMember.id);
      if (!currentSelectedExists) {
        setSelectedMember(members[0]);
      } else {
        // Sync data with updated user info
        setSelectedMember(currentSelectedExists);
      }
    }
  }, [members]);

  const handleUpdateRole = async () => {
    if (!selectedMember.id || !editingRole) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', selectedMember.id), {
        role: editingRole
      });
      setIsEditModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${selectedMember.id}`);
    } finally {
      setIsUpdating(false);
    }
  };
  const taskStatsData = useMemo(() => {
    // Determine completed tasks by user
    const completedTasksRow = tasks.filter(t => t.status === 'completed' || t.status === 'done');
    const grouped: Record<string, number> = {};
    completedTasksRow.forEach(t => {
      const assignee = t.assignedTo || 'Unassigned';
      grouped[assignee] = (grouped[assignee] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, count]) => ({
      name,
      Completadas: count
    })).sort((a,b) => b.Completadas - a.Completadas);
  }, [tasks]);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Equipo</h2>
          <p className="text-sm text-gray-500 mt-1">Directorio, rendimiento, comisiones y auditoría del personal.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'directory', label: 'Directorio & Rendimiento', icon: Users },
            { id: 'commissions', label: 'Comisiones y Pagos', icon: DollarSign },
            { id: 'security', label: 'Seguridad y Auditoría', icon: ShieldAlert },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#00F0FF] text-[#00F0FF] bg-cyan-500/10/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
            {/* DIRECTORIO Y RENDIMIENTO */}
          {activeTab === 'directory' && (
            <div className="flex flex-col xl:flex-row gap-6 h-full">
              {/* Column Lateral */}
              <div className="w-full xl:w-1/4 space-y-6">
                 {/* TALENT MATCHER - Proactive Intelligence */}
                 <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                          <Cpu className="w-5 h-5 text-[#00F0FF]" />
                       </div>
                       <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 italic">Talent Matcher</h3>
                          <p className="text-[8px] font-black text-[#00F0FF] uppercase tracking-widest">Optimización de Recursos IA</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       {[
                         { project: 'Onboarding TechCorp', ideal: 'Carlos Ruiz', reason: '90% B2B', match: 98, load: 95 },
                         { project: 'Soporte VIP Premium', ideal: 'Ana Silva', reason: '95% Soporte', match: 96, load: 60 },
                         { project: 'Automatización Flujos', ideal: 'Miguel Rojas', reason: '100% Projects', match: 92, load: 40 },
                       ].map((match, i) => (
                         <div key={i} className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 group hover:border-[#00F0FF]/30 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                               <p className="text-[10px] font-black text-gray-900 uppercase italic truncate w-32">{match.project}</p>
                               <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{match.match}% MATCH</span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-3">
                               <p className="text-[10px] text-gray-500 font-bold uppercase italic">ID: <span className="text-gray-900">{match.ideal}</span></p>
                               <div className="flex flex-col items-end gap-1">
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Carga Actual</p>
                                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                                     <div 
                                        className={`h-full ${match.load > 85 ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{ width: `${match.load}%` }}
                                     />
                                  </div>
                               </div>
                            </div>

                            <button 
                               disabled={match.load > 85}
                               className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                  match.load > 85 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed italic' 
                                  : 'bg-white border border-gray-100 text-gray-400 group-hover:bg-gray-900 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg'
                               }`}
                            >
                               {match.load > 85 ? 'Sobrecarga Detectada' : 'Asignar con Kaivincia IA'}
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Leaderboard 2.0 */}
                 <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#00F0FF]/10 rounded-full blur-[80px]" />
                    <div className="flex justify-between items-center mb-8 relative z-10">
                       <h3 className="text-lg font-black tracking-tighter uppercase italic flex items-center gap-3">
                          <Target className="w-5 h-5 text-[#00F0FF]" /> Leaderboard 2.0
                       </h3>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                       {members.sort((a,b) => (b.current || 0) - (a.current || 0)).slice(0, 5).map((member, index) => (
                         <div key={member.id} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 hover:bg-white/[0.08] transition-all">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm relative ${
                               index === 0 ? 'bg-[#00F0FF] text-white shadow-lg' :
                               index === 1 ? 'bg-gray-500 text-white' : 'bg-gray-800 text-gray-400'
                            }`}>
                               {index + 1}
                               {index === 0 && <Star className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400 fill-yellow-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="font-black text-sm uppercase tracking-tighter truncate italic">{member.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{member.role}</p>
                                  <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                  <div className="flex items-center gap-0.5 text-[8px] font-black">
                                     {member.trend === 'up' ? (
                                        <div className="flex items-center gap-0.5 text-green-400">
                                           <ArrowUpRight className="w-2.5 h-2.5" /> +4.2%
                                        </div>
                                     ) : (
                                        <div className="flex items-center gap-0.5 text-red-400">
                                           <ArrowDownRight className="w-2.5 h-2.5" /> -1.8%
                                        </div>
                                     )}
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Tareas Completadas por Usuario Chart */}
                 {taskStatsData.length > 0 && (
                   <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col gap-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 italic flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tareas Completadas
                      </h3>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart data={taskStatsData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              cursor={{fill: '#F3F4F6'}}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="Completadas" fill="#00F0FF" radius={[0, 4, 4, 0]}>
                              <LabelList dataKey="Completadas" position="right" fill="#374151" fontSize={10} fontWeight="bold" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                 )}
              </div>

              {/* Lista de Especialistas */}
              <div className="w-full xl:w-1/3 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 italic">Directorio de Elite</h3>
                  <span className="text-[10px] font-bold text-[#00F0FF] bg-cyan-500/10 px-2 py-1 rounded-lg">
                    {members.length} Agentes
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                  {members.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`p-5 rounded-[2rem] border transition-all relative overflow-hidden group ${
                        selectedMember.id === member.id 
                          ? 'border-[#00F0FF]/30 bg-gray-50 shadow-inner' 
                          : 'border-transparent hover:border-gray-100 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-4 transition-colors ${
                              member.status === 'Online' ? 'border-green-500/20 bg-green-50 text-green-700' :
                              member.status === 'Meeting' ? 'border-cyan-500/100/20 bg-cyan-500/10 text-yellow-700' :
                              'border-gray-200 bg-gray-100 text-gray-400 shadow-inner'
                          }`}>
                            {member.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            member.status === 'Online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                            member.status === 'Meeting' ? 'bg-cyan-500/100 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                            'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">{member.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">Status Nodo</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                             member.status === 'Online' ? 'bg-green-100 text-green-700' :
                             member.status === 'Meeting' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
                          }`}>{member.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel de Rendimiento 2.0 */}
              <div className="flex-1 bg-white border border-gray-100 rounded-[3rem] shadow-2xl p-10 overflow-y-auto">
                <div className="flex items-center justify-between mb-10 pb-8 border-b border-gray-50 relative">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-gray-900 flex items-center justify-center font-black text-white text-4xl italic shadow-2xl relative rotate-3 group-hover:rotate-0 transition-transform">
                      {selectedMember.avatar}
                      <div className="absolute -top-3 -left-3 bg-[#00F0FF] text-black w-8 h-8 rounded-xl flex items-center justify-center shadow-lg">
                         <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">{selectedMember.name}</h2>
                      <p className="text-sm text-[#00F0FF] font-black uppercase tracking-[0.2em] mt-1">Especialista de Elite {selectedMember.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingRole(selectedMember.role);
                      setIsEditModalOpen(true);
                    }}
                    className="h-14 px-8 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#00F0FF] transition-all shadow-xl active:scale-95"
                  >
                    Modificar Roles
                  </button>
                </div>

                {/* Meta Mensual */}
                <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#00F0FF]" /> Meta Mensual
                      </p>
                      <p className="text-2xl font-black text-gray-900 mt-1">
                        {selectedMember.type === 'sales' ? `$${selectedMember.current.toLocaleString()}` : selectedMember.current}
                        <span className="text-sm font-medium text-gray-500 ml-1">
                          / {selectedMember.type === 'sales' ? `$${selectedMember.goal.toLocaleString()}` : selectedMember.goal}
                        </span>
                      </p>
                    </div>
                    <span className="text-lg font-bold text-[#00F0FF]">
                      {Math.round((selectedMember.current / selectedMember.goal) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-[#00F0FF] h-2.5 rounded-full transition-all duration-1000" 
                      style={{ width: `${(selectedMember.current / selectedMember.goal) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* KPIs Específicos */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" /> Indicadores Clave (KPIs)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {selectedMember.type === 'sales' && (
                    <>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <Phone className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Llamadas (VoIP)</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.calls}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Tasa de Cierre</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.closeRate}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Tiempo Promedio</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.avgCallTime}</p>
                      </div>
                    </>
                  )}
                  {selectedMember.type === 'support' && (
                    <>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Alumnos Atendidos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.students}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Tickets Resueltos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.tickets}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <Activity className="w-6 h-6 text-cyan-500/100 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Satisfacción</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.satisfaction}</p>
                      </div>
                    </>
                  )}
                  {selectedMember.type === 'operations' && (
                    <>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Proyectos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.projects}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Cumplimiento</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.compliance}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm text-center">
                        <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium uppercase">Retrasos</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedMember.kpis.delays}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* SKILL MATRIX (Academia Interna) */}
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#00F0FF]" /> Skill Matrix
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
                  <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" /> Progreso vinculado a Academia Interna
                  </p>
                  <div className="space-y-4">
                    {selectedMember.skills?.map((skill, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-1/3 min-w-[120px]">
                          <p className="text-sm font-bold text-gray-900">{skill.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{skill.source}</p>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${skill.level >= 90 ? 'bg-[#00F0FF]' : skill.level >= 60 ? 'bg-green-500' : 'bg-gray-400'}`} 
                              style={{ width: `${skill.level}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-right">
                          <p className="text-xs font-black text-gray-900">{skill.level}%</p>
                        </div>
                      </div>
                    ))}
                    {(!selectedMember.skills || selectedMember.skills.length === 0) && (
                      <p className="text-sm text-gray-500 italic">No hay habilidades registradas aún.</p>
                    )}
                  </div>
                  <button className="mt-6 w-full py-2 border border-dashed border-gray-300 text-gray-500 text-sm font-bold rounded-lg hover:border-[#00F0FF] hover:text-[#00F0FF] transition-colors">
                    + Asignar Nuevo Curso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMISIONES Y PRÓXIMOS DESEMBOLSOS */}
          {activeTab === 'commissions' && (
            <div className="space-y-8 h-full">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { label: 'Bruto del Periodo', val: '$57,200', color: 'gray' },
                     { label: 'Comisiones Totales', val: '$5,150', color: 'green' },
                     { label: 'Confirmado a Pago', val: '$4,200', color: 'blue' },
                     { label: 'En Espera (Cobro)', val: '$950', color: 'amber' }
                  ].map(m => (
                     <div key={m.label} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative group">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${m.color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">{m.label}</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter italic">{m.val}</p>
                     </div>
                  ))}
               </div>

               <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl flex flex-col p-8 overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-50 gap-4">
                     <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Próximos Desembolsos</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Estimación vinculada al Pipeline de Ventas</p>
                     </div>
                     <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-2xl text-[9px] font-black uppercase border border-green-100 shadow-sm">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Confirmado
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl text-[9px] font-black uppercase border border-amber-100 shadow-sm">
                           <div className="w-2 h-2 bg-amber-500 rounded-full" /> Pendiente de Cobro
                        </div>
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white text-gray-400 font-black border-b border-gray-50 uppercase text-[9px] tracking-[0.3em]">
                        <tr>
                          <th className="px-6 py-4 italic">Especialista / Nodo</th>
                          <th className="px-6 py-4">Volumen Operado</th>
                          <th className="px-6 py-4 italic">Cálculo de Comisión</th>
                          <th className="px-6 py-4 text-right">Monto Estimado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[
                           { name: 'Carlos Ruiz', role: 'Closer', sales: '$42,000', rate: '10% B2B', status: 'confirmed', amount: '$4,200', avatar: 'C' },
                           { name: 'Ana Silva', role: 'Setter', sales: '$12,000', rate: '5% B2B', status: 'pending', amount: '$600', avatar: 'A' },
                           { name: 'Maria Gomez', role: 'Setter Premium', sales: '$3,200', rate: '10% Info', status: 'pending', amount: '$320', avatar: 'M' }
                        ].map((p, i) => (
                           <tr key={i} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-6 py-8">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg rotate-3 group-hover:rotate-0 transition-transform">{p.avatar}</div>
                                    <div>
                                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">{p.name}</h4>
                                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.role}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-8 font-black text-gray-900 text-xs italic">{p.sales}</td>
                              <td className="px-6 py-8 font-black text-[#00F0FF] text-[10px] uppercase tracking-widest">{p.rate}</td>
                              <td className="px-6 py-8 text-right">
                                 <div className="flex flex-col items-end gap-1">
                                    <div className={`text-lg font-black italic ${p.status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}`}>{p.amount}</div>
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${p.status === 'confirmed' ? 'text-green-400' : 'text-amber-400'}`}>
                                       {p.status === 'confirmed' ? '✓ Listo para Pago' : '! Pendiente Liquidación'}
                                    </p>
                                 </div>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {/* SEGURIDAD Y AUDITORÍA 2.0 */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-10">
                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
                             <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Eventos de Seguridad</h3>
                             <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" /> Sincronización Real-Time
                             </div>
                          </div>
                       </div>
                       <button className="h-12 px-6 bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2">
                          <History className="w-4 h-4" /> Exportar Logs
                       </button>
                    </div>

                    <div className="space-y-6">
                       {AUDIT_LOGS.map(log => (
                         <div key={log.id} className="group relative p-6 bg-white border border-gray-50 rounded-[2rem] hover:shadow-xl hover:border-gray-100 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-6">
                               <div className={`h-14 w-14 rounded-[1.5rem] flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform ${
                                  log.type === 'alert' ? 'bg-red-900 text-white' :
                                  log.type === 'update' ? 'bg-blue-900 text-white' : 'bg-gray-900 text-white'
                               }`}>
                                  {log.type === 'alert' ? <Lock className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                               </div>
                               <div>
                                  <h5 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic mb-1">{log.action}</h5>
                                  <div className="flex items-center gap-3">
                                     <span className="text-[9px] font-black text-[#00F0FF] uppercase tracking-widest">{log.user}</span>
                                     <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{log.time}</p>
                                  </div>
                               </div>
                            </div>
                            {log.type === 'alert' && (
                               <div className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest shadow-inner cursor-pointer hover:bg-red-600 hover:text-white transition-all">
                                  Bloquear Nodo
                               </div>
                            )}
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Lock className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                       <h3 className="text-xl font-black tracking-tighter uppercase italic mb-4 flex items-center gap-3">
                          <ShieldAlert className="w-6 h-6 text-[#00F0FF]" /> Políticas de Acceso
                       </h3>
                       <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10 italic">Restricción de acceso por geolocalización y horario de nodo.</p>
                       
                       <div className="space-y-6">
                          <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all">
                             <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Horario Operativo</p>
                                <div className="h-6 w-12 bg-[#00F0FF]/20 rounded-full relative cursor-pointer">
                                   <div className="absolute right-1 top-1 h-4 w-4 bg-[#00F0FF] rounded-full shadow-lg" />
                                </div>
                             </div>
                             <div className="flex items-center justify-between font-mono text-xl font-black italic text-[#00F0FF]">
                                <span>09:00</span>
                                <span className="text-white">→</span>
                                <span>18:00</span>
                             </div>
                          </div>

                          <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <Zap className="w-5 h-5 text-blue-400" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Auto-Bloqueo IP</p>
                             </div>
                             <div className="h-6 w-12 bg-white/10 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-lg" />
                             </div>
                          </div>
                       </div>

                       <button className="w-full mt-12 py-5 bg-[#00F0FF] text-black rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-2xl active:scale-95 italic">
                          Desplegar Políticas Nodo
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 italic">Modificar Rol</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{selectedMember.name}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Seleccionar Nuevo Rol</label>
                  <select 
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#00F0FF] outline-none transition-all"
                  >
                    <option value="Closer">Closer (Ventas)</option>
                    <option value="Setter">Setter (Citas)</option>
                    <option value="Tutor">Tutor (Academia)</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Admin">Administrador</option>
                    <option value="SuperAdmin">Super Administrador</option>
                  </select>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 italic">
                  <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                    Cambiar el rol afectará los permisos de acceso y las métricas de rendimiento trackeadas por el sistema.
                  </p>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateRole}
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#00F0FF] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isUpdating ? 'Actualizando...' : (
                    <>
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
