import { useState, useMemo, useRef } from 'react';
import { 
  GraduationCap, PlayCircle, CheckCircle2, AlertTriangle, 
  Award, BookOpen, Video, FileText, ArrowRight, Activity, Bot, Trophy,
  Users, DollarSign, BarChart3, Filter, Search, MoreVertical, ShieldCheck, Phone, X, Save, Edit2, Zap, Flame,
  Briefcase, TrendingUp, Star, MessageSquare, Sparkles, Send, ShieldAlert, BadgeCheck,
  Plus, ChevronLeft, ChevronRight, Inbox, Check, FileSpreadsheet, UploadCloud, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock Data for Courses
const initialCourses = [
  { id: '1', name: 'Setter Pro Certification', students: 145, rating: 4.9, employability: '88%', revenue: '$43,500', category: 'Prospección' },
  { id: '2', name: 'Closer Elite Master', students: 82, rating: 4.8, employability: '95%', revenue: '$41,000', category: 'Ventas de Alto Valor' },
  { id: '3', name: 'B2B Scaling Architect', students: 28, rating: 5.0, employability: '100%', revenue: '$28,000', category: 'Estrategia Empresarial' }
];

// Mock Data for Students
const initialStudents = [
  { 
    id: '1', name: 'Ana Silva', email: 'ana@example.com', course: 'Setter Pro Certification', progress: 85, 
    status: 'Activo', lastLogin: 'Hace 2 horas', supportTickets: 0, 
    grades: [9, 8.5, 9.2], ltv: 1500, employability: 'Alto'
  },
  { 
    id: '2', name: 'Miguel Rojas', email: 'miguel@example.com', course: 'Closer Elite Master', progress: 100, 
    status: 'Certificado', lastLogin: 'Hace 1 día', supportTickets: 0,
    grades: [10, 9.8, 10], ltv: 4500, employability: 'Elite'
  },
  { 
    id: '3', name: 'Laura Gómez', email: 'laura@example.com', course: 'Setter Pro Certification', progress: 15, 
    status: 'En Riesgo', lastLogin: 'Hace 5 días', supportTickets: 1,
    grades: [6, 7], ltv: 800, employability: 'Pendiente'
  },
  { 
    id: '4', name: 'David Menéndez', email: 'david@example.com', course: 'B2B Scaling Architect', progress: 60, 
    status: 'Activo', lastLogin: 'Hace 3 horas', supportTickets: 0,
    grades: [8.5, 9], ltv: 2200, employability: 'Alto'
  },
  { 
    id: '5', name: 'Elena Torres', email: 'elena@example.com', course: 'Closer Elite Master', progress: 92, 
    status: 'Activo', lastLogin: 'Hace 1 hora', supportTickets: 0,
    grades: [9.5, 9.2], ltv: 3400, employability: 'Elite'
  },
  { 
    id: '6', name: 'Javier Morales', email: 'javier@example.com', course: 'Setter Pro Certification', progress: 40, 
    status: 'Activo', lastLogin: 'Ayer', supportTickets: 0,
    grades: [7.8, 8.1], ltv: 1200, employability: 'Medio'
  }
];

export default function AcademyInternal() {
  const [activeTab, setActiveTab] = useState('panel');
  const [courses, setCourses] = useState(initialCourses);
  const [students, setStudents] = useState(initialStudents);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isStudentMode, setIsStudentMode] = useState(false);
  const [conversionStudent, setConversionStudent] = useState<any | null>(null);

  // Modals
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // New Course Form State
  const [newCourseForm, setNewCourseForm] = useState({
    name: '',
    category: 'Ventas B2B',
    revenue: '$15,000',
    employability: '90%',
    rating: 5.0
  });

  // New Student Form State
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    course: 'Setter Pro Certification',
    status: 'Activo',
    progress: 10
  });
  const [studentModalTab, setStudentModalTab] = useState<'single' | 'bulk'>('single');
  const [bulkParsedStudents, setBulkParsedStudents] = useState<any[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkError, setBulkError] = useState('');
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Filters and Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const tickets = [
    { id: '1', student: 'Laura Gómez', query: '¿Cómo manejo la objeción de "tengo que consultarlo con mi socio"?', status: 'pending', time: '10 min ago' },
    { id: '2', student: 'Carlos Ruiz', query: 'Duda con el script de cierre en la fase 3.', status: 'pending', time: '1h ago' }
  ];

  const [ticketsList, setTicketsList] = useState(tickets);
  const [activeTicket, setActiveTicket] = useState<any | null>(tickets[0] || null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  const aiSuggestions: any = {
    '1': "Basado en el video 'Módulo 4: Objeciones de Poder', la respuesta ideal es: 'Entiendo perfectamente, Juan. De hecho, la mayoría de nuestros clientes con socios usan la estructura de decisión compartida. ¿Te parece si agendamos una breve de 10 min mañana con él para resolver dudas técnicas?'",
    '2': "El video 12 de Closer Elite menciona que en la fase 3 debes anclar el valor antes de soltar el precio. Sugiero recordarle el 'gap' de ingresos que identificaste en la fase 1."
  };

  const handleSaveStudent = () => {
    if (!editingStudent) return;
    setStudents(students.map(s => s.id === editingStudent.id ? editingStudent : s));
    setEditingStudent(null);
    showToast('Alumno actualizado correctamente');
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseForm.name.trim()) return;

    const newCourse = {
      id: `${courses.length + 1}`,
      name: newCourseForm.name.trim(),
      students: 0,
      rating: newCourseForm.rating,
      employability: newCourseForm.employability,
      revenue: newCourseForm.revenue,
      category: newCourseForm.category
    };

    setCourses([...courses, newCourse]);
    setNewCourseForm({
      name: '',
      category: 'Ventas B2B',
      revenue: '$15,000',
      employability: '90%',
      rating: 5.0
    });
    setShowNewCourseModal(false);
    showToast(`Curso "${newCourse.name}" creado con éxito`);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim()) return;

    const newStudent = {
      id: `${Date.now()}`,
      name: newStudentForm.name.trim(),
      email: newStudentForm.email.trim(),
      course: newStudentForm.course,
      progress: Number(newStudentForm.progress) || 0,
      status: newStudentForm.status,
      lastLogin: 'Recién registrado',
      supportTickets: 0,
      grades: [10],
      ltv: 1200,
      employability: 'En evaluación'
    };

    setStudents([newStudent, ...students]);
    setNewStudentForm({
      name: '',
      email: '',
      course: courses[0]?.name || 'Setter Pro Certification',
      status: 'Activo',
      progress: 10
    });
    setShowAddStudentModal(false);
    showToast(`Alumno "${newStudent.name}" añadido exitosamente`);
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    setBulkError('');

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      
      if (lines.length <= 1) {
        setBulkError('El archivo CSV está vacío o solo contiene encabezados.');
        setBulkParsedStudents([]);
        return;
      }

      // Parse lines (skipping header if first line has 'nombre' or 'email')
      const startIndex = lines[0].toLowerCase().includes('nombre') || lines[0].toLowerCase().includes('email') ? 1 : 0;
      const parsed: any[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        // Split by comma or semicolon
        const delimiter = lines[i].includes(';') ? ';' : ',';
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        if (cols[0] && cols[1]) {
          parsed.push({
            id: `bulk-${Date.now()}-${i}`,
            name: cols[0],
            email: cols[1],
            course: cols[2] || courses[0]?.name || 'Setter Pro Certification',
            progress: Number(cols[3]) || 0,
            status: cols[4] || 'Activo',
            lastLogin: 'Cargado vía CSV',
            supportTickets: 0,
            grades: [9.0],
            ltv: 1200,
            employability: 'En evaluación'
          });
        }
      }

      if (parsed.length === 0) {
        setBulkError('No se encontraron registros válidos. Usa el formato: Nombre, Email, Curso, Progreso, Estado');
        setBulkParsedStudents([]);
      } else {
        setBulkParsedStudents(parsed);
      }
    } catch (err) {
      setBulkError('Error al leer el archivo. Asegúrate de que sea un archivo de texto o CSV válido.');
      setBulkParsedStudents([]);
    }
  };

  const handleConfirmBulkImport = () => {
    if (bulkParsedStudents.length === 0) return;
    setStudents([...bulkParsedStudents, ...students]);
    showToast(`Se importaron ${bulkParsedStudents.length} alumnos correctamente.`);
    setShowAddStudentModal(false);
    setBulkParsedStudents([]);
    setBulkFileName('');
    setStudentModalTab('single');
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nombre,Email,Curso,Progreso,Estado\n" +
      "Carla Mendoza,carla.mendoza@email.com,Setter Pro Certification,15,Activo\n" +
      "Pablo Hernández,pablo.h@email.com,Closer Elite Master,40,Activo\n" +
      "Lucía Torres,lucia.t@email.com,B2B Scaling Architect,85,Activo\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_alumnos_kaivincia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendTicketReply = () => {
    if (!ticketReplyText.trim() || !activeTicket) return;
    setTicketsList(ticketsList.filter(t => t.id !== activeTicket.id));
    setTicketReplyText('');
    const remaining = ticketsList.filter(t => t.id !== activeTicket.id);
    setActiveTicket(remaining[0] || null);
    showToast('Respuesta enviada y ticket resuelto');
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Filtered and paginated students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCourse = courseFilter === 'Todos' || s.course === courseFilter;
      return matchSearch && matchCourse;
    });
  }, [students, searchQuery, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

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
            className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" /> Ver Modo Estudiante
          </button>
          <button 
            onClick={() => setShowNewCourseModal(true)}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            <BookOpen className="h-4 w-4 text-blue-600" /> Nuevo Curso
          </button>
          <button 
            onClick={() => setShowAddStudentModal(true)}
            className="bg-[#00F0FF] text-gray-950 font-bold px-4 py-2 rounded-lg hover:bg-[#00D4E0] flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            <Users className="h-4 w-4" /> Añadir Alumno
          </button>
        </div>
      </div>

      {feedbackToast && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Hero Illustration - Height restricted */}
      <div className="w-full h-36 md:h-44 rounded-3xl overflow-hidden relative border border-gray-200 group shrink-0 shadow-sm">
         <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent z-10" />
         <img 
           src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1600&q=80" 
           alt="Academia" 
           className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
         />
         <div className="absolute bottom-4 left-6 z-20 flex flex-col gap-1">
            <h2 className="text-white text-xl md:text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">Manuales y Academia Interna</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#deff9a] shadow-[0_0_10px_#deff9a] animate-pulse" />
              <span className="text-[10px] font-mono text-[#deff9a] uppercase tracking-[0.2em] drop-shadow-md">Ecosistema de Capacitación & Empleabilidad High-Ticket</span>
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
                     {courses.map((c) => (
                       <div key={c.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 group hover:border-blue-200 transition-all gap-4">
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
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-gray-50/50">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Buscar alumno por nombre o email..." 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white outline-none"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 hidden md:inline">Curso:</span>
                  <select 
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white outline-none font-medium text-gray-700"
                  >
                    <option value="Todos">Todos los Cursos</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
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
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
                          <p className="font-semibold text-gray-700">No se encontraron alumnos</p>
                          <p className="text-xs text-gray-400 mt-1">Prueba cambiando el filtro de búsqueda o el curso seleccionado.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => (
                        <tr key={student.id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{student.name}</div>
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
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                                    setConversionStudent(student);
                                  }}
                                  className="text-xs bg-[#00F0FF] text-black font-bold px-3 py-1.5 rounded hover:bg-[#00D4E0] transition-colors cursor-pointer"
                                >
                                  Escalar a B2B
                                </button>
                              )}
                              <button 
                                onClick={() => setEditingStudent(student)}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                title="Editar Alumno"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {filteredStudents.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                  <div>
                    Mostrando <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> de <span className="font-bold text-gray-900">{filteredStudents.length}</span> alumnos
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                            currentPage === num 
                              ? 'bg-gray-900 text-white shadow-sm' 
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
              <div className="lg:col-span-1 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                 <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 italic">Cola de Tickets</h3>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                      {ticketsList.length} pendientes
                    </span>
                 </div>
                 <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {ticketsList.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center h-full text-gray-400">
                        <Inbox className="w-12 h-12 text-emerald-500/60 mb-3" />
                        <h4 className="text-sm font-bold text-gray-700">Cola despejada</h4>
                        <p className="text-xs text-gray-400 mt-1">No hay tickets pendientes de respuesta.</p>
                      </div>
                    ) : (
                      ticketsList.map(ticket => (
                        <div 
                          key={ticket.id}
                          onClick={() => {
                            setActiveTicket(ticket);
                            setTicketReplyText('');
                          }}
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
                              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                              <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Esperando Respuesta</span>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden min-h-[500px]">
                {ticketsList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 shadow-sm">
                       <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">¡Bandeja al Día!</h3>
                    <p className="text-sm text-gray-500 font-medium mt-2 max-w-md">Todos los tickets de soporte han sido atendidos exitosamente. Los alumnos están avanzando satisfactoriamente en sus manuales y simulaciones.</p>
                    <button 
                      onClick={() => {
                        setTicketsList(tickets);
                        setActiveTicket(tickets[0]);
                        showToast('Tickets de demostración restablecidos');
                      }}
                      className="mt-6 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md"
                    >
                      Cargar Tickets de Prueba
                    </button>
                  </div>
                ) : activeTicket ? (
                  <div className="flex flex-col h-full">
                    <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                       <div className="flex items-center gap-4 md:gap-6">
                          <div className="h-14 w-14 md:h-16 md:w-16 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-white italic font-black text-2xl shadow-xl">{activeTicket.student[0]}</div>
                          <div>
                             <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter italic">{activeTicket.student}</h3>
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 italic">Ticket ID: {activeTicket.id}-LEARN</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-100 text-blue-700 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-200">
                             <Sparkles className="w-3 h-3 text-blue-600" /> IA Sugiriendo
                          </span>
                       </div>
                    </div>

                    <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-6 bg-gray-50/30">
                       <div className="flex justify-start">
                          <div className="max-w-[85%] bg-white border border-gray-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm">
                             <p className="text-sm text-gray-900 font-semibold leading-relaxed">{activeTicket.query}</p>
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-4">Enviado por el alumno ({activeTicket.time})</p>
                          </div>
                       </div>

                       {aiSuggestions[activeTicket.id] && (
                         <div className="flex justify-end">
                            <div className="max-w-[85%] bg-blue-600 border border-blue-500 p-6 md:p-8 rounded-[2rem] rounded-tr-none shadow-2xl relative overflow-hidden group">
                               <div className="absolute top-0 right-0 p-4 opacity-10">
                                  <Sparkles className="w-12 h-12 text-white" />
                                </div>
                               <div className="flex items-center gap-3 mb-3">
                                  <Bot className="w-5 h-5 text-white" />
                                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest italic">Sugerencia Kaivincia IA</span>
                               </div>
                               <p className="text-sm text-white font-medium italic leading-relaxed">
                                  {aiSuggestions[activeTicket.id]}
                               </p>
                               <div className="flex gap-2 mt-5">
                                  <button 
                                    onClick={() => setTicketReplyText(aiSuggestions[activeTicket.id])}
                                    className="flex-1 h-11 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 cursor-pointer shadow-sm"
                                  >
                                    Aplicar Sugerencia
                                  </button>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="p-6 md:p-8 border-t border-gray-100 bg-white shadow-inner">
                       <form 
                         onSubmit={(e) => {
                           e.preventDefault();
                           handleSendTicketReply();
                         }}
                         className="flex gap-3"
                       >
                          <input 
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            className="flex-1 h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Escribe una respuesta personalizada o aplica la sugerencia IA..."
                          />
                          <button 
                            type="submit"
                            disabled={!ticketReplyText.trim()}
                            className="h-14 px-6 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer font-bold text-xs uppercase tracking-widest"
                          >
                             <Send className="w-4 h-4" />
                             <span className="hidden sm:inline">Responder</span>
                          </button>
                       </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
                       <MessageSquare className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Selecciona un Ticket</h3>
                    <p className="text-sm text-gray-400 font-medium mt-2 max-w-xs">Elige una consulta de la lista para visualizar el contexto y la sugerencia de respuesta generada por la IA.</p>
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveStudent}
                className="px-6 py-2 bg-[#00F0FF] text-black font-bold rounded-lg hover:bg-[#00D4E0] flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Curso</h3>
                  <p className="text-xs text-gray-500">Añade un nuevo programa formativo a la academia</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewCourseModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre del Curso *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: AI Outbound Automation Specialist"
                  value={newCourseForm.name}
                  onChange={e => setNewCourseForm({ ...newCourseForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select 
                    value={newCourseForm.category}
                    onChange={e => setNewCourseForm({ ...newCourseForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white outline-none"
                  >
                    <option value="Prospección">Prospección</option>
                    <option value="Ventas de Alto Valor">Ventas de Alto Valor</option>
                    <option value="Estrategia Empresarial">Estrategia Empresarial</option>
                    <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                    <option value="Operaciones & Soporte">Operaciones & Soporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Revenue Proyectado
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej: $20,000"
                    value={newCourseForm.revenue}
                    onChange={e => setNewCourseForm({ ...newCourseForm, revenue: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tasa Empleabilidad
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej: 92%"
                    value={newCourseForm.employability}
                    onChange={e => setNewCourseForm({ ...newCourseForm, employability: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Calificación Inicial
                  </label>
                  <input 
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newCourseForm.rating}
                    onChange={e => setNewCourseForm({ ...newCourseForm, rating: parseFloat(e.target.value) || 5.0 })}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Crear Curso
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Añadir Alumnos a la Academia</h3>
                  <p className="text-xs text-gray-500">Matricula alumnos de forma individual o mediante archivo CSV / Excel</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 pt-2">
              <button
                type="button"
                onClick={() => setStudentModalTab('single')}
                className={`pb-2.5 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                  studentModalTab === 'single'
                    ? 'border-[#00F0FF] text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Registro Manual Directo
              </button>
              <button
                type="button"
                onClick={() => setStudentModalTab('bulk')}
                className={`pb-2.5 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  studentModalTab === 'bulk'
                    ? 'border-[#00F0FF] text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Carga Masiva (CSV / Excel)
              </button>
            </div>

            {studentModalTab === 'single' ? (
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: Sofía Ramírez"
                    value={newStudentForm.name}
                    onChange={e => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="sofia@ejemplo.com"
                    value={newStudentForm.email}
                    onChange={e => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Curso
                    </label>
                    <select 
                      value={newStudentForm.course}
                      onChange={e => setNewStudentForm({ ...newStudentForm, course: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white outline-none"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Estado Inicial
                    </label>
                    <select 
                      value={newStudentForm.status}
                      onChange={e => setNewStudentForm({ ...newStudentForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white outline-none"
                    >
                      <option value="Activo">Activo</option>
                      <option value="En Riesgo">En Riesgo</option>
                      <option value="Certificado">Certificado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Progreso Inicial
                    </label>
                    <span className="text-xs font-bold text-cyan-600">{newStudentForm.progress}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newStudentForm.progress}
                    onChange={e => setNewStudentForm({ ...newStudentForm, progress: parseInt(e.target.value) || 0 })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 bg-[#00F0FF] text-gray-950 font-bold rounded-xl text-sm hover:bg-[#00D4E0] transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Añadir Alumno
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Cargar Lista de Alumnos</h4>
                    <p className="text-xs text-gray-500">Formato admitido: CSV separado por comas o punto y coma</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-700 font-semibold bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-100 hover:bg-cyan-100 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar Plantilla
                  </button>
                </div>

                {/* Dropzone */}
                <div 
                  onClick={() => bulkFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    bulkFileName ? 'border-cyan-400 bg-cyan-50/40' : 'border-gray-300 hover:border-[#00F0FF] bg-gray-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={bulkFileInputRef}
                    onChange={handleBulkFileChange}
                    accept=".csv,.txt,.xlsx"
                    className="hidden"
                  />
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {bulkFileName ? bulkFileName : 'Haz clic para seleccionar tu archivo CSV / Excel'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Columnas: Nombre, Email, Curso, Progreso, Estado</p>
                </div>

                {bulkError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                    {bulkError}
                  </p>
                )}

                {/* Preview Table */}
                {bulkParsedStudents.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>Vista previa de alumnos detectados ({bulkParsedStudents.length})</span>
                      <span className="text-cyan-600">Formato válido</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                      {bulkParsedStudents.slice(0, 8).map((st, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-gray-50">
                          <div>
                            <span className="font-bold text-gray-900">{st.name}</span>
                            <span className="text-gray-500 ml-2">({st.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-mono text-[10px]">{st.course}</span>
                            <span className="text-gray-600 font-semibold">{st.progress}%</span>
                          </div>
                        </div>
                      ))}
                      {bulkParsedStudents.length > 8 && (
                        <div className="p-2 text-center text-gray-400 bg-gray-50 text-[11px]">
                          ... y {bulkParsedStudents.length - 8} alumnos más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setBulkParsedStudents([]);
                      setBulkFileName('');
                    }}
                    className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button"
                    disabled={bulkParsedStudents.length === 0}
                    onClick={handleConfirmBulkImport}
                    className="px-6 py-2.5 bg-[#00F0FF] text-gray-950 font-bold rounded-xl text-sm hover:bg-[#00D4E0] transition-colors flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Users className="w-4 h-4" /> Importar {bulkParsedStudents.length > 0 ? `(${bulkParsedStudents.length})` : ''} Alumnos
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
