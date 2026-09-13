import { useState } from 'react';
import { 
  GraduationCap, PlayCircle, CheckCircle2, AlertTriangle, 
  Award, BookOpen, Video, FileText, ArrowRight, Activity, Bot, Trophy,
  Users, DollarSign, BarChart3, Filter, Search, MoreVertical, ShieldCheck, Phone, X, Save, Edit2, Zap, Flame,
  Briefcase, TrendingUp, Star, MessageSquare, Sparkles, Send, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock Data for Students
const initialStudents = [
  { 
    id: '1', name: 'Ana Silva', email: 'ana@example.com', course: 'Setter Pro', progress: 85, 
    status: 'Activo', lastLogin: 'Hace 2 horas', supportTickets: 0, 
    grades: [9, 8.5, 9.2], ltv: 1500, employability: 'Alto'
  },
  { 
    id: '2', name: 'Miguel Rojas', email: 'miguel@example.com', course: 'Closer Elite', progress: 100, 
    status: 'Certificado', lastLogin: 'Hace 1 día', supportTickets: 0,
    grades: [10, 9.8, 10], ltv: 4500, employability: 'Elite'
  },
  { 
    id: '3', name: 'Laura Gómez', email: 'laura@example.com', course: 'Setter Pro', progress: 15, 
    status: 'En Riesgo', lastLogin: 'Hace 5 días', supportTickets: 1,
    grades: [6, 7], ltv: 800, employability: 'Pendiente'
  },
];

export default function AcademyInternal() {
  const [activeTab, setActiveTab] = useState('panel');
  const [students, setStudents] = useState(initialStudents);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [conversionStudent, setConversionStudent] = useState<any | null>(null);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  const tickets = [
    { id: '1', student: 'Laura Gómez', query: '¿Cómo manejo la objeción de "tengo que consultarlo con mi socio"?', status: 'pending', time: '10 min ago' },
    { id: '2', student: 'Carlos Ruiz', query: 'Duda con el script de cierre en la fase 3.', status: 'pending', time: '1h ago' }
  ];

  const aiSuggestions: any = {
    '1': "Basado en el video 'Módulo 4: Objeciones de Poder', la respuesta ideal es: 'Entiendo perfectamente, Juan. De hecho, la mayoría de nuestros clientes con socios usan la estructura de decisión compartida. ¿Te parece si agendamos una breve de 10 min mañana con él para resolver dudas técnicas?'",
    '2': "El video 12 de Closer Elite menciona que en la fase 3 debes anclar el valor antes de soltar el precio. Sugiero recordarle el 'gap' de ingresos que identificaste en la fase 1."
  };

  const handleSaveStudent = () => {
    if (!editingStudent) return;
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
  };

  if (isStudentMode) {
    return (
      <div className="space-y-6 flex flex-col h-full bg-[#0a0a0c] min-h-screen -m-6 p-6 font-sans">
        {/* Student View - Dark Learning Mode */}
        <div className="flex justify-between items-center bg-[#1a1b1e] p-6 rounded-2xl shadow-xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
               <GraduationCap className="w-7 h-7 text-blue-400 font-bold" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2 italic tracking-tighter">
                KAIVINCIA <span className="text-blue-400">ACADEMY</span>
              </h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">Entorno de Alto Rendimiento Educativo</p>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
               <div className="text-right">
                 <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Power Score</p>
                 <span className="text-xl font-black text-white italic">850</span>
               </div>
               <Zap className="w-5 h-5 text-cyan-500/100 fill-cyan-500/100 animate-pulse" />
            </div>
            <button 
              onClick={() => setIsStudentMode(false)}
              className="bg-white text-black px-6 py-3 rounded-xl font-black hover:bg-blue-400 transition-all text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
            >
              ADMIN PANEL
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Main Area: Current Courses */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1b1e] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <PlayCircle className="w-64 h-64 text-blue-400" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] font-mono">Status: En Curso</h3>
                </div>

                <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30">Ventas B2B</span>
                        <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/30 font-mono">ELITE</span>
                      </div>
                      <h4 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Closer Elite Master</h4>
                      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Lección Actual: Psicología del "Sí" Inmediato</p>
                    </div>
                    <div className="relative w-24 h-24">
                       <svg className="w-24 h-24 transform -rotate-90">
                         <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                         <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.32" strokeDashoffset={251.32 * (1 - 0.75)} className="text-blue-500 transition-all duration-1000 ease-out" />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-black text-white italic tracking-tighter">75%</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="flex-1 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black flex justify-center items-center gap-3 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 text-[10px] uppercase tracking-widest italic group">
                      <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" /> Retomar Lección
                    </button>
                    <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all">
                       <FileText className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="mt-12">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 italic">Ruta de Especialización</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[
                       { title: 'Fundamentos Setter', progress: 100, icon: CheckCircle2, status: 'DONE' },
                       { title: 'Soporte VIP Premium', progress: 100, icon: CheckCircle2, status: 'DONE' }
                     ].map((item, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/5 transition-all">
                           <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center border border-green-500/30">
                              <item.icon className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{item.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                 <span className="text-[8px] font-black text-green-500">{item.status}</span>
                                 <span className="text-[8px] font-black text-gray-500">100%</span>
                              </div>
                           </div>
                        </div>
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar: Digital Badges & Progress */}
          <div className="space-y-6">
            <div className="bg-[#1a1b1e] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Award className="w-32 h-32 text-blue-500" />
               </div>
               
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 italic flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-cyan-500/100" /> Insignias Digitales (WEB3)
               </h3>

               <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: 'METAL CLOSER', level: 'Diamond', color: 'from-blue-400 to-blue-900', icon: BadgeCheck },
                    { name: 'TECH ADAPTER', level: 'Platinum', color: 'from-gray-300 to-gray-600', icon: ShieldCheck }
                  ].map((badge, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02, rotateY: 5 }}
                      className={`relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-br ${badge.color} border border-white/10 shadow-2xl group cursor-pointer`}
                    >
                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="relative z-10 flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                             <badge.icon className="w-8 h-8 text-white shadow-lg" />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-white italic tracking-tighter leading-tight">{badge.name}</h4>
                             <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mt-1">Nivel: {badge.level}</p>
                          </div>
                       </div>
                       <div className="absolute bottom-[-10px] right-[-10px] opacity-20 transform rotate-12">
                          <badge.icon className="w-24 h-24 text-white" />
                       </div>
                    </motion.div>
                  ))}
               </div>

               <div className="mt-10 border-t border-white/5 pt-8">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Power Level Expansion</p>
                     <span className="text-[10px] font-black text-blue-400">NEXT: ADVANCED</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                     />
                  </div>
               </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/20 p-8 rounded-[2.5rem] relative overflow-hidden backdrop-blur-md">
               <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Sparkles className="w-24 h-24 text-purple-400" />
               </div>
               <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4" /> Recomendación IA
               </h4>
               <p className="text-xs text-purple-200 leading-relaxed font-bold uppercase italic tabular-nums">
                  "Tu perfil de <span className="text-white">Closer Elite</span> muestra un 92% de éxito. Sugerimos el workshop de <span className="text-white">'Ventas Consultivas para SaaS'</span> para desbloquear proyectos de +$10k."
               </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fábrica de Talento (Academia)</h2>
          <p className="text-sm text-gray-500 mt-1">Gestión de alumnos, cursos y embudos de venta</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsStudentMode(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg"
          >
            <GraduationCap className="h-4 w-4" /> Ver Modo Estudiante
          </button>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
            <BookOpen className="h-4 w-4" /> Nuevo Curso
          </button>
          <button className="bg-[#00F0FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2 shadow-sm">
            <Users className="h-4 w-4" /> Añadir Alumno
          </button>
        </div>
      </div>

      {/* Hero Illustration */}
      <div className="w-full aspect-[21/6] md:aspect-[21/4] rounded-3xl overflow-hidden relative border border-gray-200 group shrink-0">
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
         <img 
           src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1600&q=80" 
           alt="Academia" 
           className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
         />
         <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2">
            <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Manuales y Academia Interna</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#deff9a] shadow-[0_0_10px_#deff9a] animate-pulse" />
              <span className="text-[10px] font-mono text-[#deff9a] uppercase tracking-[0.2em] drop-shadow-md">floating 3D digital book with glowing DNA strands & skill-tree</span>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'panel', label: 'Panel Central', icon: Activity },
            { id: 'alumnos', label: 'Gestión de Alumnos', icon: Users },
            { id: 'embudos', label: 'Embudos de Venta', icon: Filter },
            { id: 'soporte', label: 'Soporte Académico', icon: Bot },
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
          
          {/* PANEL CENTRAL */}
          {activeTab === 'panel' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Ventas Academy Hoy', val: '$3,840', sub: '↑ 24% vs ayer', icon: DollarSign, color: 'green' },
                  { label: 'LTV Promedio Alumno', val: '$1,850', sub: 'Ecosistema Completo', icon: TrendingUp, color: 'blue' },
                  { label: 'Quality Score Academy', val: '9.4/10', sub: 'NPS Global', icon: Zap, color: 'purple' },
                  { label: 'Conversion B2B Rate', val: '12.5%', sub: 'De Alumno a Cliente', icon: Briefcase, color: 'amber' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden relative group">
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{stat.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter">{stat.val}</h3>
                        <p className={`text-[8px] font-black mt-1 uppercase ${stat.color === 'amber' ? 'text-amber-500' : stat.color === 'blue' ? 'text-blue-500' : 'text-green-500'}`}>{stat.sub}</p>
                      </div>
                      <div className={`p-3 bg-${stat.color}-50 rounded-2xl group-hover:rotate-12 transition-transform`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Cursos en Alta Conversión</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Métricas de Empleabilidad & ROI</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Live Multi-Flow</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                     {[
                       { name: 'Setter Pro Certification', students: 145, rating: 4.9, employability: '88%', revenue: '$43,500' },
                       { name: 'Closer Elite Master', students: 82, rating: 4.8, employability: '95%', revenue: '$41,000' },
                       { name: 'B2B Scaling Architect', students: 28, rating: 5.0, employability: '100%', revenue: '$28,000' }
                     ].map((c, i) => (
                       <div key={i} className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 group hover:border-blue-200 transition-all gap-4">
                          <div className="flex items-center gap-6 flex-1 w-full">
                            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white italic font-black text-xl shadow-xl group-hover:rotate-6 transition-transform">
                               {c.name[0]}
                            </div>
                            <div>
                               <h4 className="text-base font-black text-gray-900 uppercase tracking-tighter italic">{c.name}</h4>
                               <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-cyan-500/100">
                                     <Star className="w-3 h-3 fill-current" />
                                     <span className="text-[10px] font-black">{c.rating}</span>
                                  </div>
                                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Employability: {c.employability}</span>
                               </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8 text-right w-full md:w-auto justify-end">
                             <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Revenue Node</p>
                                <p className="text-sm font-black text-green-600 italic tracking-tighter">{c.revenue}</p>
                             </div>
                             <div className="w-px h-10 bg-gray-200 hidden md:block" />
                             <div>
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Nodes Active</p>
                                <p className="text-sm font-black text-gray-900 italic tracking-tighter">{c.students}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-gray-900 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Trophy className="w-48 h-48 text-[#00F0FF]" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-[#00F0FF] uppercase tracking-tighter italic mb-4 flex items-center gap-4">
                      <TrendingUp className="w-6 h-6" /> Escalamiento Elite
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10 italic">
                      Miguel Rojas ha completado la ruta crítica de Closer Elite y califica para migración directa al ecosistema de clientes.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm relative overflow-hidden group/card hover:bg-white/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-[#00F0FF] rounded-2xl flex items-center justify-center font-black text-black text-xl italic shadow-2xl">M</div>
                             <div>
                                <p className="text-sm font-black text-white italic uppercase tracking-tighter truncate w-32">Miguel Rojas</p>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">Closer Elite Master</p>
                             </div>
                          </div>
                          <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-green-500/30">COMPLETED</div>
                        </div>
                        
                        <div className="space-y-3 mb-8">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                              <span>Power Score</span>
                              <span className="text-white">1000/1000</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#00F0FF] w-full" />
                           </div>
                        </div>

                        <button 
                          onClick={() => setConversionStudent(initialStudents.find(s => s.name === 'Miguel Rojas'))}
                          className="w-full py-5 bg-[#00F0FF] text-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_10px_20px_rgba(181,154,69,0.2)] active:scale-95 italic"
                        >
                          Convertir a Cliente B2B
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GESTIÓN DE ALUMNOS */}
          {activeTab === 'alumnos' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Buscar alumno..." 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                  />
                </div>
                <div className="flex gap-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white">
                    <option>Todos los Cursos</option>
                    <option>Setter Pro</option>
                    <option>Closer Elite</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Alumno</th>
                      <th className="px-6 py-3">Curso Actual</th>
                      <th className="px-6 py-3">Progreso</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Último Acceso</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-gray-500 text-xs">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">{student.course}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                              <div className={`h-1.5 rounded-full ${student.progress === 100 ? 'bg-green-500' : 'bg-[#00F0FF]'}`} style={{ width: `${student.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            student.status === 'Certificado' ? 'bg-green-100 text-green-700' :
                            student.status === 'En Riesgo' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{student.lastLogin}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {student.status === 'Certificado' && (
                              <button 
                                onClick={() => {
                                  alert(`Simulación: ${student.name} ha sido escalado a Cliente B2B. Se ha creado un perfil en Gestión de Clientes.`);
                                }}
                                className="text-xs bg-[#00F0FF] text-white px-3 py-1.5 rounded hover:bg-[#00BFFF] transition-colors font-medium"
                              >
                                Escalar a B2B
                              </button>
                            )}
                            <button 
                              onClick={() => setEditingStudent(student)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="Editar Alumno"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-[#00F0FF] transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EMBUDOS DE VENTA */}
          {activeTab === 'embudos' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Embudo: Setter Pro Certification</h3>
                  <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                    <option>Últimos 30 días</option>
                    <option>Este mes</option>
                  </select>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="w-full md:w-1/4 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center relative">
                    <p className="text-sm text-gray-500 font-medium mb-1">Visitas (Leads)</p>
                    <p className="text-3xl font-bold text-gray-900">2,450</p>
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-gray-300" />
                    </div>
                  </div>
                  <div className="w-full md:w-1/4 bg-blue-50 border border-blue-100 rounded-xl p-5 text-center relative">
                    <p className="text-sm text-blue-600 font-medium mb-1">Iniciaron Checkout</p>
                    <p className="text-3xl font-bold text-blue-900">420</p>
                    <p className="text-xs text-blue-500 mt-1">17% conv.</p>
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-blue-300" />
                    </div>
                  </div>
                  <div className="w-full md:w-1/4 bg-green-50 border border-green-100 rounded-xl p-5 text-center">
                    <p className="text-sm text-green-600 font-medium mb-1">Ventas (Alumnos)</p>
                    <p className="text-3xl font-bold text-green-900">85</p>
                    <p className="text-xs text-green-500 mt-1">20% conv.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOPORTE ACADÉMICO IA */}
          {activeTab === 'soporte' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-1 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                 <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 italic">Cola de Tickets</h3>
                 </div>
                 <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {tickets.map(ticket => (
                      <div 
                        key={ticket.id}
                        onClick={() => setActiveTicket(ticket)}
                        className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative group ${
                          activeTicket?.id === ticket.id ? 'border-blue-500/30 bg-blue-50 shadow-inner' : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic">{ticket.student}</h4>
                            <span className="text-[8px] font-black text-gray-400 uppercase">{ticket.time}</span>
                         </div>
                         <p className="text-[10px] text-gray-500 line-clamp-2 font-bold italic">"{ticket.query}"</p>
                         <div className="flex items-center gap-2 mt-4">
                            <div className="h-2 w-2 bg-amber-500 rounded-full" />
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Esperando Respuesta</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                {activeTicket ? (
                  <div className="flex flex-col h-full">
                    <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                       <div className="flex items-center gap-6">
                          <div className="h-16 w-16 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-white italic font-black text-2xl shadow-xl">{activeTicket.student[0]}</div>
                          <div>
                             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">{activeTicket.student}</h3>
                             <p className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest mt-1 italic">Ticket ID: {activeTicket.id}-LEARN</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-200">
                             <Sparkles className="w-3 h-3" /> IA Sugiriendo
                          </span>
                       </div>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto space-y-8 bg-gray-50/30">
                       <div className="flex justify-start">
                          <div className="max-w-[80%] bg-white border border-gray-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm">
                             <p className="text-sm text-gray-900 font-bold leading-relaxed">{activeTicket.query}</p>
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-4">Enviado por el alumno</p>
                          </div>
                       </div>

                       <div className="flex justify-end">
                          <div className="max-w-[80%] bg-blue-600 border border-blue-500 p-8 rounded-[2rem] rounded-tr-none shadow-2xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-12 h-12 text-white" />
                             </div>
                             <div className="flex items-center gap-3 mb-4">
                                <Bot className="w-5 h-5 text-white" />
                                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest italic">Sugerencia Kaivincia IA</span>
                             </div>
                             <p className="text-sm text-white font-black italic leading-relaxed">
                                {aiSuggestions[activeTicket.id as keyof typeof aiSuggestions]}
                             </p>
                             <div className="flex gap-2 mt-6">
                                <button className="flex-1 h-12 bg-white text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">Aplicar Sugerencia</button>
                                <button className="h-12 w-12 bg-blue-700 text-white rounded-xl flex items-center justify-center hover:bg-blue-800 transition-all"><Edit2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-8 border-t border-gray-100 bg-white shadow-inner">
                       <div className="flex gap-4">
                          <input 
                            className="flex-1 h-16 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-sm font-bold uppercase placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Escribe una respuesta personalizada..."
                          />
                          <button className="h-16 w-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-blue-600 transition-all active:scale-90">
                             <Send className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200 mb-8 border border-gray-100">
                       <MessageSquare className="w-16 h-16" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Selecciona un Ticket</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-xs">La IA ya está analizando las dudas de los alumnos para optimizar tu tiempo.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* B2B CONVERSION MODAL */}
      <AnimatePresence>
        {conversionStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConversionStudent(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-[#0a0a0c] w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(181,154,69,0.2)] overflow-hidden relative z-10 font-sans"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <ShieldCheck className="w-64 h-64 text-[#00F0FF]" />
              </div>

              <div className="flex flex-col md:flex-row h-full">
                 {/* Lateral Decorativo/Info */}
                 <div className="w-full md:w-1/3 bg-[#111115] p-10 border-r border-white/5 flex flex-col gap-8">
                    <div className="h-16 w-16 bg-[#00F0FF] rounded-2xl flex items-center justify-center text-black font-black text-3xl italic shadow-2xl">{conversionStudent.name[0]}</div>
                    <div>
                       <h3 className="text-3xl font-black text-white italic tracking-tighter leading-tight uppercase underline decoration-[#00F0FF]/30">Migration Protocol</h3>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-3">Ref: KAIV-MIG-{conversionStudent.id}</p>
                    </div>
                    <div className="space-y-4">
                       <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Employability Score</p>
                          <p className="text-xl font-black text-blue-400 italic">ELITE (98%)</p>
                       </div>
                       <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Academic LTV</p>
                          <p className="text-xl font-black text-[#00F0FF] italic">${conversionStudent.ltv}</p>
                       </div>
                    </div>
                 </div>

                 {/* Content Principal */}
                 <div className="flex-1 p-12">
                    <div className="flex justify-between items-start mb-10">
                       <div>
                          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Convertir a Cliente B2B</h2>
                          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-4 flex items-center gap-2">
                             <Sparkles className="w-3 h-3 text-[#00F0FF]" /> El sistema ha verificado los requisitos de migración.
                          </p>
                       </div>
                       <button onClick={() => setConversionStudent(null)} className="h-12 w-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-gray-500 transition-all">
                          <X className="w-6 h-6" />
                       </button>
                    </div>

                    <div className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:border-[#00F0FF]/30 transition-all group cursor-pointer">
                             <div className="flex items-center gap-3 mb-3 text-[#00F0FF]">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Validación de Perfil</span>
                             </div>
                             <p className="text-[9px] text-gray-500 font-bold leading-relaxed uppercase">Migrar historial de aprendizaje y Power Score al nuevo Workspace.</p>
                          </div>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:border-blue-400/30 transition-all group cursor-pointer">
                             <div className="flex items-center gap-3 mb-3 text-blue-400">
                                <Briefcase className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Setup Corporativo</span>
                             </div>
                             <p className="text-[9px] text-gray-500 font-bold leading-relaxed uppercase">Crear nuevo espacio de trabajo B2B con acceso a Facturación y CRM.</p>
                          </div>
                       </div>

                       <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem]">
                          <div className="flex items-start gap-4 text-red-500">
                             <ShieldAlert className="w-6 h-6" />
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Atención Requerida</p>
                                <p className="text-[11px] font-bold italic mt-1 uppercase leading-relaxed text-red-400/80">Esta acción convertirá permanentemente el perfil de alumno en un perfil de CLIENTE CORPORATIVO. Se aplicarán términos de servicio B2B.</p>
                             </div>
                          </div>
                       </div>

                       <button 
                         onClick={() => {
                           alert('Ejecutando protocolo de migración real-time...');
                           setConversionStudent(null);
                         }}
                         className="w-full h-20 bg-white text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] hover:bg-[#00F0FF] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-95 italic flex items-center justify-center gap-4 group"
                       >
                         Ejecutar Migración de Datos <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Editar Alumno</h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={editingStudent.name} 
                  onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select 
                  value={editingStudent.status} 
                  onChange={e => setEditingStudent({...editingStudent, status: e.target.value})}
                  className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white"
                >
                  <option value="Activo">Activo</option>
                  <option value="Certificado">Certificado</option>
                  <option value="En Riesgo">En Riesgo</option>
                  <option value="Inactivo">Inactivo (Pago Fallido)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progreso (%)</label>
                <input 
                  type="number" 
                  min="0" max="100"
                  value={editingStudent.progress} 
                  onChange={e => setEditingStudent({...editingStudent, progress: parseInt(e.target.value)})}
                  className="w-full border-gray-300 rounded-lg p-2 border focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveStudent}
                className="px-6 py-2 bg-[#00F0FF] text-white rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
