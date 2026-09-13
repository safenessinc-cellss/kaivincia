import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderKanban, LayoutDashboard, CheckSquare, BarChart3, 
  TrendingUp, AlertTriangle, Clock, Users, DollarSign,
  Plus, X, Calendar, Briefcase, Target, ArrowRight,
  Zap, Sparkles, Activity, ShieldCheck
} from 'lucide-react';

const HUMAN_HOUR_COST = 55; // USD/hora promedio para ROI Real

const Sparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  
  return (
    <div className="flex items-end gap-0.5 h-6 w-16">
      {data.map((val, i) => (
        <div 
          key={i} 
          className="w-1 bg-blue-500/30 rounded-t-full transition-all hover:bg-blue-500" 
          style={{ height: `${((val - min) / range) * 100}%` }}
        />
      ))}
    </div>
  );
};

export default function Projects() {
  const { userData } = useOutletContext<{ userData: any }>();
  const [activeTab, setActiveTab] = useState('panel');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    budget: '',
    roi: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Planificación'
  });

  const [newLog, setNewLog] = useState({
    projectId: '',
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Lógica de "En Riesgo" automática
        let status = data.status;
        const budget = Number(data.budget) || 0;
        const progress = Number(data.progress) || 0;
        const logs = timeLogs.filter(l => l.projectId === doc.id);
        const totalHours = logs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
        const spent = totalHours * HUMAN_HOUR_COST;
        
        if (status !== 'Finalizado' && budget > 0) {
          if (spent > budget * 0.8 && progress < 50) {
            status = 'En riesgo';
          }
        }

        return { id: doc.id, ...data, status, spent, totalHours };
      });

      if (projectsData.length === 0) {
        setProjects([
          { id: '1', name: 'Generación Leads USA', client: 'TechSolutions', status: 'En ejecución', health: 'En tiempo', progress: 65, roi: '300%', budget: 5000, startDate: '2026-01-15', healthTrace: [10, 15, 12, 18, 22, 20, 25] },
          { id: '2', name: 'Onboarding Global Corp', client: 'Global Corp', status: 'Planificación', health: 'Retrasado leve', progress: 15, roi: '150%', budget: 12000, startDate: '2026-03-01', healthTrace: [5, 4, 3, 4, 5, 6, 8] },
          { id: 'erp-1', name: 'Implementación ERP', client: 'TechSolutions', status: 'En riesgo', health: 'Crítico', progress: 40, roi: '200%', budget: 8000, startDate: '2026-02-10', healthTrace: [15, 25, 35, 45, 55, 65, 80] },
        ]);
      } else {
        setProjects(projectsData);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'projects'));

    const unsubLogs = onSnapshot(query(collection(db, 'time_logs'), orderBy('date', 'desc')), (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimeLogs(logsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'time_logs'));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

    return () => {
      unsubProjects();
      unsubLogs();
      unsubClients();
    };
  }, [timeLogs.length]);

  const hasMora = (project: any) => {
    const linkedClient = clients.find(c => c.id === project.clientId || c.name === project.client);
    return linkedClient && linkedClient.status !== 'Activo' && (Number(linkedClient.amount) || 0) > 0;
  };

  const calculateRealROI = (p: any) => {
    if (!p.budget || p.budget === 0) return 'N/A';
    const profit = p.budget - (p.spent || 0);
    const roi = (profit / p.budget) * 100;
    return `${Math.round(roi)}%`;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const project = {
        ...newProject,
        budget: Number(newProject.budget),
        progress: 0,
        health: 'En tiempo',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'projects'), project);
      setIsProjectModalOpen(false);
      setNewProject({
        name: '',
        client: '',
        budget: '',
        roi: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Planificación'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const log = {
        ...newLog,
        hours: Number(newLog.hours),
        userName: userData?.name || 'Usuario',
        userUid: userData?.uid || '',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'time_logs'), log);
      setIsLogModalOpen(false);
      setNewLog({
        projectId: '',
        hours: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'time_logs');
    }
  };

  const handleDragStart = (e: any, id: string) => {
    setDraggedProjectId(id);
    e.dataTransfer.setData('projectId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('projectId') || draggedProjectId;
    if (!id) return;

    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'Finalizado') {
        const project = projects.find(p => p.id === id);
        if (project) {
          updates.progress = 100;
          updates.health = 'Completado';
          updates.closedAt = new Date().toISOString();
          alert(`Proyecto "${project.name}" finalizado.`);
        }
      }

      await updateDoc(doc(db, 'projects', id), updates);
      setDraggedProjectId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const stages = ['Planificación', 'En ejecución', 'En riesgo', 'Finalizado'];

  return (
    <div className="space-y-6 flex flex-col h-full bg-[#f8fafc]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">Cerebro de Ejecución</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Sincronización de Recursos, ROI y Desempeño</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-white/50 backdrop-blur-md border border-gray-100 rounded-2xl p-1 px-3 flex items-center gap-4 shadow-sm">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-gray-400 uppercase">Costo Hora Humana</span>
                 <span className="text-xs font-black text-gray-900 font-mono">${HUMAN_HOUR_COST}/h</span>
              </div>
           </div>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl shadow-gray-200"
          >
            <Clock className="w-4 h-4" /> Log de Horas
          </button>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-[#00F0FF] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-[#00F0FF]/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Proyectos Activos', value: projects.filter(p => p.status === 'En ejecución').length, color: 'text-blue-600', glow: 'shadow-blue-100' },
          { label: 'ROI Promedio', value: '245%', color: 'text-[#00F0FF]', glow: 'shadow-yellow-100' },
          { label: 'Hitos en Riesgo', value: projects.filter(p => p.status === 'En riesgo').length, color: 'text-red-600', glow: 'shadow-red-100' },
          { label: 'Eficiencia Operativa', value: '92.4%', color: 'text-green-600', glow: 'shadow-green-100' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl ${stat.glow}`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color} tracking-tighter italic`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar shrink-0 bg-gray-50/50">
          {[
            { id: 'panel', label: 'Centro de Comando', icon: LayoutDashboard },
            { id: 'kanban', label: 'Monitor de Tareas', icon: CheckSquare },
            { id: 'kpis', label: 'Auditoría ROI', icon: TrendingUp },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'text-gray-900 bg-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1 overflow-y-auto bg-gray-50/10">
          {activeTab === 'panel' && (
            <div className="space-y-8">
              {/* Quick Hour Logger Area */}
              <div className="bg-gray-900 rounded-[2rem] p-6 text-white flex items-center justify-between gap-8 border border-white/10 shadow-2xl">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
                       <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                       <h4 className="text-sm font-black uppercase tracking-tighter italic">Carga Rápida de Hitos</h4>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrastra un proyecto aquí para loguear 1h</p>
                    </div>
                 </div>
                 <div className="flex-1 h-14 border-2 border-dashed border-gray-700 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all cursor-pointer">
                    Zona de Goteo IA
                 </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest italic">
                      <th className="px-8 py-5">Identificador del Proyecto</th>
                      <th className="px-8 py-5">Entidad</th>
                      <th className="px-8 py-5">Health Status</th>
                      <th className="px-8 py-5">Tendencia (7d)</th>
                      <th className="px-8 py-5">Ciclo de Avance</th>
                      <th className="px-8 py-5 text-right">ROI Real</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((p, i) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`hover:bg-blue-50/50 cursor-pointer group transition-colors ${p.status === 'En riesgo' ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg ${
                                p.status === 'En riesgo' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-900 group-hover:bg-[#00F0FF] group-hover:text-white transition-all'
                              }`}>
                                 <Briefcase className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="font-black text-gray-900 uppercase text-xs tracking-tighter italic">{p.name}</p>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Iniciado: {p.startDate}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-[11px] font-black text-gray-600 uppercase tracking-tighter">{p.client}</p>
                           {hasMora(p) && <span className="text-[8px] font-black text-red-500 uppercase bg-red-100 px-2 py-0.5 rounded-full mt-1 inline-block">Mora Detectada</span>}
                        </td>
                        <td className="px-8 py-6">
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                            p.status === 'En riesgo' ? 'text-red-600' :
                            p.health === 'Retrasado leve' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              p.status === 'En riesgo' ? 'bg-red-600' :
                              p.health === 'Retrasado leve' ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`} />
                            {p.status === 'En riesgo' ? 'Crítico (En Riesgo)' : p.health}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <Sparkline data={p.healthTrace || [10, 15, 12, 18, 22, 20, 25]} />
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-2">
                             <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Progreso</span>
                                <span className="text-gray-900">{p.progress}%</span>
                             </div>
                             <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${p.progress}%` }}
                                   className={`h-full rounded-full ${
                                      p.status === 'Planificación' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                      p.status === 'En riesgo' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                      'bg-gradient-to-r from-purple-400 to-purple-600'
                                   }`} 
                                />
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className={`text-sm font-black italic tracking-tighter ${p.spent > p.budget ? 'text-red-600' : 'text-green-600'}`}>
                              {calculateRealROI(p)}
                           </p>
                           <p className="text-[9px] font-black text-gray-400 uppercase font-mono tracking-widest">
                              Gasto: ${p.spent?.toLocaleString()} / ${p.budget?.toLocaleString()}
                           </p>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
              {stages.map((stage, sIdx) => (
                <div 
                  key={stage}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                  className="flex-shrink-0 w-80 bg-white/50 border border-gray-100 rounded-[2rem] flex flex-col shadow-sm"
                >
                  <div className="p-6 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stage === 'Planificación' ? 'bg-blue-500' :
                        stage === 'En ejecución' ? 'bg-green-500' :
                        stage === 'En riesgo' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest italic">{stage}</h4>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {projects.filter(p => p.status === stage).length} Units
                    </span>
                  </div>

                  <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {projects.filter(p => p.status === stage).map((p, i) => (
                      <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, p.id)}
                        className={`bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-xl cursor-grab active:cursor-grabbing group hover:scale-[1.02] transition-all relative overflow-hidden ${
                           p.status === 'En riesgo' ? 'ring-2 ring-red-500 shadow-red-100' : ''
                        }`}
                      >
                        {p.status === 'En riesgo' && (
                           <div className="absolute top-0 right-0 p-2 text-red-500 animate-pulse">
                              <AlertTriangle className="w-4 h-4 fill-current" />
                           </div>
                        )}
                        <h5 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic mb-4">{p.name}</h5>
                        
                        <div className="flex items-center gap-2 mb-6">
                           <div className="h-6 w-6 bg-gray-50 rounded-lg flex items-center justify-center">
                              <Users className="w-3 h-3 text-gray-400" />
                           </div>
                           <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{p.client}</span>
                        </div>

                        <div className="space-y-1 mb-6">
                           <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">
                              <span>Health Check</span>
                              <span className={p.status === 'En riesgo' ? 'text-red-500' : 'text-green-500'}>{p.status === 'En riesgo' ? 'CRITICAL' : 'STABLE'}</span>
                           </div>
                           <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${p.progress}%` }}
                                 className={`h-full ${p.status === 'En riesgo' ? 'bg-red-500' : 'bg-gray-900'}`} 
                              />
                           </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                           <div className="flex -space-x-1.5">
                              {[1, 2, 3].map(i => (
                                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#00F0FF] text-white flex items-center justify-center text-[8px] font-black">
                                    {i === 1 ? 'M' : i === 2 ? 'J' : 'K'}
                                 </div>
                              ))}
                           </div>
                           <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest font-mono">
                              ROI: {calculateRealROI(p)}
                           </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'kpis' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 text-[#00F0FF]/10">
                     <TrendingUp className="w-16 h-16" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 font-mono">ROI Global Promedio</p>
                  <p className="text-4xl font-black text-gray-900 italic tracking-tighter">245%</p>
                  <div className="flex items-center gap-2 mt-4 text-green-600 bg-green-50 w-max px-3 py-1 rounded-full text-[9px] font-black uppercase">
                     <TrendingUp className="w-3 h-3" /> ↑ 15% vs Q4 2025
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-2xl relative overflow-hidden">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 font-mono">Desviación Presupuestaria</p>
                  <p className="text-4xl font-black text-red-600 italic tracking-tighter">4.2%</p>
                  <p className="text-[10px] text-gray-500 mt-4 uppercase font-black tracking-widest italic">Dentro del Umbral Maestro</p>
                </div>
                <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 font-mono">Hitos On-Time</p>
                  <p className="text-4xl font-black text-blue-500 italic tracking-tighter">92.4%</p>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-6 overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8">
                   <ShieldCheck className="w-12 h-12 text-[#00F0FF]/10" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic mb-10">Análisis Pormenorizado de Rentabilidad Real</h3>
                <div className="h-80 flex items-end justify-around gap-8 pt-10">
                  {projects.map((p, i) => (
                    <div key={i} className="flex flex-col items-center gap-4 w-full max-w-[140px] group">
                      <div className="relative w-full flex items-end justify-center gap-2">
                        {/* ROI Estimado */}
                        <motion.div initial={{ height: 0 }} animate={{ height: '140px' }} className="w-6 bg-gray-100 rounded-t-lg group-hover:bg-gray-200 transition-all"></motion.div>
                        {/* ROI Real */}
                        <motion.div 
                           initial={{ height: 0 }} 
                           animate={{ height: p.spent > 0 ? '160px' : '0px' }} 
                           className={`w-6 rounded-t-lg transition-all ${p.spent > p.budget ? 'bg-red-500 shadow-xl shadow-red-100' : 'bg-[#00F0FF] shadow-xl shadow-yellow-100'}`}
                        />
                      </div>
                      <div className="text-center">
                         <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter italic truncate w-32">{p.name}</p>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{calculateRealROI(p)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-10 mt-12 pt-8 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-100 rounded-lg"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ROI Estimado (Core)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#00F0FF] rounded-lg shadow-lg shadow-yellow-100"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ROI Real (Cerebro IA)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer Overlay (Floating) */}
      <AnimatePresence>
         {true && (
           <motion.div 
             initial={{ y: 100 }}
             animate={{ y: 0 }}
             className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-40"
           >
              <div className="flex items-center gap-3 border-r border-white/10 pr-8">
                 <div className="h-10 w-10 bg-[#00F0FF] rounded-2xl flex items-center justify-center text-white font-black italic">!</div>
                 <div>
                    <p className="text-[10px] font-black text-white uppercase italic">Alertas en Riesgo</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">3 Proyectos requieren intervención</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-all">Generar Reporte CEO</button>
                 <button className="px-6 py-2 border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Auditar Todos</button>
              </div>
           </motion.div>
         )}
      </AnimatePresence>
      
      {/* New Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Configurar Nuevo Proyecto</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Proyecto</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                    placeholder="Ej. Expansión Mercado Latam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente / Entidad</label>
                  <input 
                    required
                    value={newProject.client}
                    onChange={e => setNewProject({...newProject, client: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Inicio</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date"
                      required
                      value={newProject.startDate}
                      onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Presupuesto (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number"
                      required
                      value={newProject.budget}
                      onChange={e => setNewProject({...newProject, budget: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ROI Estimado (%)</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number"
                      required
                      value={newProject.roi}
                      onChange={e => setNewProject({...newProject, roi: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                      placeholder="Ej. 200"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  Lanzar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log de Horas Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Registro de Horas (Auditado)</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddLog} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seleccionar Proyecto</label>
                <select 
                  required
                  value={newLog.projectId}
                  onChange={e => setNewLog({...newLog, projectId: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                >
                  <option value="">Seleccione un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Horas</label>
                  <input 
                    type="number"
                    step="0.5"
                    required
                    value={newLog.hours}
                    onChange={e => setNewLog({...newLog, hours: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</label>
                  <input 
                    type="date"
                    required
                    value={newLog.date}
                    onChange={e => setNewLog({...newLog, date: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción de la Tarea</label>
                <textarea 
                  required
                  value={newLog.description}
                  onChange={e => setNewLog({...newLog, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00F0FF] outline-none"
                  rows={3}
                  placeholder="¿En qué has trabajado?"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                >
                  Registrar Horas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
