import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, BookOpen, MonitorPlay, 
  BarChart3, X, Zap, ShieldCheck, 
  Globe, Cpu, Layers, Sparkles, Navigation,
  Play, Users, Star, Lock, ChevronRight, User, Settings, UserPlus,
  MapPin, Briefcase, FileText, Clock, ChevronLeft, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import DataEcosystemParticles from '../components/DataEcosystemParticles';
import Footer from '../components/Footer';

interface LandingPageProps {
  onGuestMode: () => void;
}

export default function LandingPage({ onGuestMode }: LandingPageProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'jobs'));
    return () => unsubscribe();
  }, []);

  const eliteClients = [
    { name: 'Royal Prestige', industry: 'Ventas Directas', focus: 'High Ticket Sales', icon: '💎' },
    { name: 'Rena Ware', industry: 'Sistemas Térmicos', focus: 'Direct Distribution', icon: '🔋' },
    { name: 'Kitchen Craft', industry: 'Utensilios de Cocina', focus: 'Sales Recruitment', icon: '🍳' },
    { name: 'Global Health', industry: 'Bienestar Social', focus: 'Agent Formation', icon: '🏥' },
    { name: 'Prestige Group', industry: 'Marketing Directo', focus: 'Neural Operations', icon: '👑' },
    { name: 'Master Cook', industry: 'Gastronomía Élite', focus: 'Training Academy', icon: '👨‍🍳' }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const courses = [
    { 
      id: 1, 
      title: 'Appointment Setter Mastery', 
      price: '$497', 
      rating: 4.9, 
      students: 1240, 
      image: 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&q=80&w=400',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    { 
      id: 2, 
      title: 'Growth Agency Systems', 
      price: '$997', 
      rating: 5.0, 
      students: 850, 
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    { 
      id: 3, 
      title: 'Sales Psychology 2.0', 
      price: '$297', 
      rating: 4.8, 
      students: 2100, 
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  ];

  const handleGuestEntry = () => {
    onGuestMode();
    navigate('/guest-academy');
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 font-sans selection:bg-[#00F0FF]/30 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <img src="/images/portada.jpg" alt="Portada de la web" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#05070a]/80 via-black/80 to-[#00F0FF]/10 animate-gradient" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00F0FF]/10 rounded-full blur-[150px]" />
        <DataEcosystemParticles />
      </div>

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#05070a]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic"></span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Sistemas', 'Academia'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00F0FF] transition-colors">
                {item}
              </a>
            ))}
            <button 
              onClick={() => setShowResults(true)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00F0FF] transition-colors"
            >
              Resultados
            </button>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {userData?.role === 'superadmin' && (
                  <Link to="/crm/superadmin" className="hidden lg:flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all backdrop-blur-md">
                    <Settings className="w-3 h-3" /> Panel de Control
                  </Link>
                )}
                <Link to="/crm/dashboard" className="px-6 py-2.5 rounded-full bg-[#00F0FF] text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                  Ir al CRM
                </Link>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-md">
                Acceso Cliente
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 z-10 text-center">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">The Operating System for Elite Agencies</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white leading-[0.9] tracking-tighter mb-10"
          >
            Vende más,<br /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00F0FF] via-white to-[#00F0FF] animate-gradient italic">Opera menos.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium"
          >
            Kaivincia es el ecosistema inteligente que fusiona Sales Hub, Academia y Operaciones en una infraestructura única diseñada para el 2026.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button 
              onClick={handleGuestEntry}
              className="w-full sm:w-auto group bg-[#00F0FF] text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
            >
              Explorar como Invitado <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
            <Link to="/apply" className="w-full sm:w-auto bg-white/5 backdrop-blur-md border border-white/10 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
              Agendar Demo Pro
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview (WOW Factor) */}
      <section className="relative px-6 py-20 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[4rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-8 overflow-hidden group shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#00F0FF]/5 to-transparent pointer-events-none" />
            
            {/* Blurred Mock UI */}
            <div className="filter blur-[8px] opacity-20 transition-all group-hover:blur-[2px] duration-1000 scale-105">
               <div className="grid grid-cols-4 gap-6 mb-8">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />
                 ))}
               </div>
               <div className="h-[400px] bg-white/5 rounded-[3rem]" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
              <div className="h-20 w-20 bg-[#00F0FF] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#00F0FF]/40 animate-bounce">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-white mb-4">Estructura Corporativa de Élite</h2>
              <p className="text-gray-400 max-w-lg mb-8 font-medium">Controla cada métrica, desde el ROAS de marketing hasta el nivel de felicidad de tu equipo, en una sola pantalla.</p>
              <div className="flex gap-4">
                 <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">Full CRM</span>
                 <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">Project Mgmt</span>
                 <span className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00F0FF] border border-[#00F0FF]/30">AI Powered</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="sistemas" className="py-32 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 row-span-2 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-[3rem] p-10 relative overflow-hidden group">
               <div className="relative z-10">
                  <h3 className="text-xs font-black text-[#00F0FF] uppercase tracking-[0.3em] mb-4">Inteligencia Operativa</h3>
                  <h4 className="text-4xl font-serif font-bold text-white mb-6">Pipeline con IA que cierra solo.</h4>
                  <p className="text-gray-400 font-medium leading-relaxed mb-8">Nuestro CRM detecta la temperatura del lead y agenda automáticamente recordatorios basados en psicología de ventas.</p>
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800" />
                    ))}
                  </div>
               </div>
               <div className="absolute bottom-[-20%] right-[-10%] opacity-10 group-hover:opacity-20 transition-opacity">
                  <Layers className="w-80 h-80 text-white" />
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col justify-between group">
               <div className="h-12 w-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
               </div>
               <div>
                  <h4 className="text-xl font-bold text-white mb-2">Real-Time MRR</h4>
                  <p className="text-sm text-gray-500">Visualiza tu crecimiento neto al segundo con integración bancaria.</p>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col justify-between group overflow-hidden relative">
               <div className="h-12 w-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <MonitorPlay className="w-6 h-6 text-purple-500" />
               </div>
               <div>
                  <h4 className="text-xl font-bold text-white mb-2">Automations</h4>
                  <p className="text-sm text-gray-500">Despide el trabajo manual. Deja que la IA gestione tus reportes.</p>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Sparkles className="w-20 h-20" />
               </div>
            </div>

            <div className="md:col-span-2 bg-[#0a0c10] border border-white/5 rounded-[3rem] p-10 flex items-center gap-8 group">
               <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-emerald-700 rounded-[2rem] flex items-center justify-center shadow-xl shadow-green-500/20">
                  <Globe className="w-10 h-10 text-white" />
               </div>
               <div>
                  <h4 className="text-2xl font-bold text-white mb-2">Fábrica de Talento</h4>
                  <p className="text-sm text-gray-500">Recluta, educa y certifica a tu equipo sin intervención humana.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Academy Section */}
      <section id="academia" className="py-32 bg-[#080a0e] z-10 px-6">
        <div className="max-w-7xl mx-auto text-center mb-20">
          <h2 className="text-xs font-black text-[#00F0FF] uppercase tracking-[0.3em] mb-4">Elite Training</h2>
          <h3 className="text-5xl font-serif font-bold text-white">Escala tu potencial.</h3>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           {courses.map((course) => (
             <motion.div 
               key={course.id}
               whileHover={{ y: -10 }}
               className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden group cursor-pointer"
               onClick={() => setSelectedCourse(course)}
             >
                <div className="h-56 relative overflow-hidden">
                   <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                         <Play className="w-6 h-6 fill-current" />
                      </div>
                   </div>
                   <div className="absolute top-4 left-4 px-3 py-1 bg-[#00F0FF] rounded-full text-[9px] font-black uppercase text-black tracking-widest">
                      Bestseller
                   </div>
                </div>
                <div className="p-8">
                   <div className="flex items-center gap-2 mb-4">
                      <Star className="w-3 h-3 text-[#00F0FF] fill-current" />
                      <span className="text-[10px] font-black text-white">{course.rating}</span>
                      <span className="text-[10px] text-gray-500">({course.students} Alumnos)</span>
                   </div>
                   <h4 className="text-xl font-bold text-white mb-6 uppercase tracking-tighter leading-none">{course.title}</h4>
                   <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-white">{course.price}</span>
                      <button className="flex items-center gap-2 text-[10px] font-black uppercase text-[#00F0FF] tracking-widest hover:translate-x-1 transition-transform">
                         Preview Gratis <ChevronRight className="w-3 h-3" />
                      </button>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* AI Powered Careers Section (Carousel) */}
      <section id="careers" className="relative py-32 px-6 z-10 overflow-hidden bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#00F0FF]/10 rounded-full mb-6 border border-[#00F0FF]/20 animate-pulse">
                <Bot className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00F0FF]">Ecosistema Reclutamiento IA</span>
              </div>
              <h4 className="text-5xl lg:text-7xl font-serif font-bold text-white mb-8 leading-[0.9]">
                Nodos de Talento <br />
                <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-white to-[#00F0FF]">Automatizados.</span>
              </h4>
              <p className="text-xl text-gray-400 font-medium leading-relaxed">
                Nuestra Inteligencia Artificial busca arquitectos operativos. Explora las vacantes estratégicas indexadas por el motor <b className="text-white">Kaivincia Talent AI</b>.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => carouselRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#00F0FF] hover:text-black hover:border-[#00F0FF] transition-all group"
              >
                <ChevronLeft className="w-6 h-6 group-active:scale-90" />
              </button>
              <button 
                onClick={() => carouselRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#00F0FF] hover:text-black hover:border-[#00F0FF] transition-all group"
              >
                <ChevronRight className="w-6 h-6 group-active:scale-90" />
              </button>
            </div>
          </div>

          <div 
            ref={carouselRef}
            className="flex gap-8 overflow-x-auto pb-12 snap-x no-scrollbar scroll-smooth"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {(jobs.length > 0 ? jobs : [
              {
                id: 'f-1',
                title: 'Arquitecto de Sistemas IA',
                department: 'Tecnología',
                location: 'Remoto',
                type: 'Tiempo Completo',
                description: 'Diseño e implementación de flujos de automatización avanzados y modelos de lenguaje locales para optimización empresarial.',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
                createdAt: new Date().toISOString(),
                status: 'active'
              },
              {
                id: 'f-2',
                title: 'Setter High Ticket Senior',
                department: 'Ventas Elite',
                location: 'Madrid / Híbrido',
                type: 'Comisión + Base',
                description: 'Especialista en prospección y agendamiento de llamadas para productos de alto valor. Dominio de psicología de persuasión.',
                image: 'https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=800&auto=format&fit=crop',
                createdAt: new Date().toISOString(),
                status: 'active'
              },
              {
                id: 'f-3',
                title: 'Media Buyer Estratégico',
                department: 'Marketing',
                location: 'Global / Remoto',
                type: 'Tiempo Completo',
                description: 'Gestión de tráfico pago en Meta, Google y TikTok con enfoque en ROI masivo y escalabilidad de embudos híbridos.',
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
                createdAt: new Date().toISOString(),
                status: 'active'
              }
            ]).map((job) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex-shrink-0 w-[380px] snap-center group"
              >
                <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 h-full flex flex-col justify-between hover:bg-white/[0.05] transition-all relative overflow-hidden">
                   <div className="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundImage: `url(${job.image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'})` }} />
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-10">
                        <div className="h-14 w-14 bg-gray-900 rounded-[1.5rem] flex items-center justify-center text-[#00F0FF] shadow-2xl border border-white/5">
                           <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[#00F0FF]">
                            <Sparkles className="w-2 h-2" /> AI Indexed
                          </span>
                        </div>
                      </div>

                      <h4 className="text-3xl font-serif font-bold text-white mb-4 leading-tight group-hover:text-[#00F0FF] transition-colors uppercase tracking-tighter italic">
                        {job.title}
                      </h4>

                      <div className="flex flex-wrap gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">
                         <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#00F0FF]" /> {job.location}</div>
                         <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-[#00F0FF]" /> {job.type}</div>
                      </div>

                      <p className="text-sm text-gray-500 font-medium leading-relaxed italic line-clamp-3 mb-8">
                        {job.description}
                      </p>
                   </div>

                   <div className="relative z-10 space-y-4">
                      <button 
                        onClick={() => setActiveJob(job)}
                        className="w-full py-4 text-[11px] font-black uppercase border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:border-white hover:bg-white/5 transition-all"
                      >
                         Analítica de la Vacante
                      </button>
                      <Link 
                        to={`/careers`}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-[#00F0FF] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-black transition-all shadow-xl shadow-[#00F0FF]/20"
                      >
                         Postularse con IA <ArrowRight className="w-4 h-4" />
                      </Link>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-2">Gestión Automatizada via Kaivincia Core</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vacancy Detail Modal */}
      <AnimatePresence>
        {activeJob && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-[#0a0c10] border border-white/10 rounded-[4rem] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative shadow-[0_0_100px_rgba(0,240,255,0.1)]"
             >
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                   <div className="flex items-center gap-6 text-left">
                      <div className="h-16 w-16 bg-gray-900 rounded-[2rem] flex items-center justify-center text-[#00F0FF] shadow-2xl">
                         <UserPlus className="w-8 h-8" />
                      </div>
                      <div>
                         <h3 className="text-3xl font-serif font-bold text-white uppercase italic tracking-tighter leading-none">{activeJob.title}</h3>
                         <p className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest mt-2">{activeJob.department} • RRHH Kaivincia</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setActiveJob(null)}
                     className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                   >
                     <X className="w-6 h-6 text-white" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2 space-y-10">
                         <div>
                            <h4 className="text-xs font-black text-[#00F0FF] uppercase tracking-[0.3em] mb-6">Misión Operativa</h4>
                            <p className="text-lg text-gray-300 font-medium leading-relaxed italic">{activeJob.description}</p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-8">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                               <MapPin className="w-5 h-5 text-[#00F0FF] mb-3" />
                               <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Ubicación</h5>
                               <p className="text-sm text-gray-400 font-medium italic">{activeJob.location}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                               <Briefcase className="w-5 h-5 text-[#00F0FF] mb-3" />
                               <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Tipo de Nodo</h5>
                               <p className="text-sm text-gray-400 font-medium italic">{activeJob.type}</p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8 bg-white/[0.02] p-8 rounded-[3rem] border border-white/5">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-white/5 pb-4">Protocolo de Aplicación</h4>
                         
                         <div className="space-y-6">
                            {[
                               { icon: FileText, label: 'CV en PDF Validado', color: 'text-blue-500' },
                               { icon: Users, label: 'Perfil Professional', color: 'text-[#00F0FF]' },
                               { icon: ShieldCheck, label: 'Filtro IA Kaivincia', color: 'text-emerald-500' }
                            ].map((step, i) => (
                              <div key={i} className="flex items-center gap-4">
                                 <div className={`h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center ${step.color}`}>
                                    <step.icon className="w-5 h-5" />
                                 </div>
                                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{step.label}</span>
                              </div>
                            ))}
                         </div>

                         <div className="pt-6">
                            <Link 
                              to={`/apply?jobId=${activeJob.id}`}
                              className="w-full h-16 bg-white text-black rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest hover:bg-[#00F0FF] hover:text-white transition-all shadow-xl"
                            >
                               Postularme Ahora
                            </Link>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative z-10 overflow-hidden">
        <Footer />
      </section>

      {/* Elite Clients / Results Modal */}
      <AnimatePresence>
        {showResults && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 50, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.9, y: 50, opacity: 0 }}
               className="bg-[#0a0c10] border border-white/10 rounded-[4rem] max-w-5xl w-full p-12 lg:p-16 relative shadow-[0_0_100px_rgba(0,240,255,0.1)] overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Star className="w-64 h-64 text-[#00F0FF]" />
                </div>

                <button 
                  onClick={() => setShowResults(false)}
                  className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>

                <div className="relative z-10 text-center mb-16">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F0FF]/10 rounded-full mb-6 border border-[#00F0FF]/20"
                  >
                    <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00F0FF]">Impacto Real en el Mundo Kaivincia</span>
                  </motion.div>
                  <h2 className="text-5xl lg:text-7xl font-serif font-bold text-white mb-6">Partners de Élite</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">Empresas líderes han transformado su infraestructura operativa y de ventas con nuestros sistemas inteligentes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {eliteClients.map((client, idx) => (
                    <motion.div
                      key={client.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="group p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 hover:bg-[#00F0FF]/5 hover:border-[#00F0FF]/20 transition-all duration-500 cursor-default"
                    >
                      <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">
                        {client.icon}
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">{client.name}</h4>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-[#00F0FF] uppercase tracking-widest">{client.industry}</span>
                        <p className="text-xs text-gray-500 font-medium">{client.focus}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-16 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-8">+ 100 ORGANIZACIONES OPTIMIZADAS GLOBALES</p>
                  <div className="flex justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
                     <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
                     <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
                     <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse" />
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Video Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-[#11141b] border border-white/5 rounded-[3rem] max-w-4xl w-full overflow-hidden shadow-2xl relative"
             >
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[110]"
                >
                  <X className="w-8 h-8" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                   <div className="p-1 pb-0 lg:pb-1">
                      <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden">
                        <video controls className="w-full h-full object-cover">
                           <source src={selectedCourse.video} type="video/mp4" />
                        </video>
                      </div>
                   </div>
                   <div className="p-12 flex flex-col justify-center">
                      <h3 className="text-[10px] font-black text-[#00F0FF] uppercase tracking-[0.3em] mb-4">Muestra Gratuita</h3>
                      <h4 className="text-3xl font-serif font-bold text-white mb-6 leading-tight">{selectedCourse.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">Logra la maestría en este módulo y conviértete en un ejecutor de élite dentro del ecosistema Kaivincia.</p>
                      
                      <div className="space-y-4 mb-10">
                         {['Acceso Vitalicio', 'Certificación Oficial', 'Mentoría Personalizada'].map(item => (
                           <div key={item} className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-bold text-white">{item}</span>
                           </div>
                         ))}
                      </div>

                      <Link to="/login" className="bg-[#00F0FF] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center hover:bg-white hover:text-black transition-all shadow-xl shadow-[#00F0FF]/20">
                         Regístrate para ver Completo
                      </Link>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
