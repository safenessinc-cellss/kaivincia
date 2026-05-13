import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, BookOpen, MonitorPlay, 
  BarChart3, X, Zap, ShieldCheck, 
  Globe, Cpu, Layers, Sparkles, Navigation,
  Play, Users, Star, Lock, ChevronRight, User, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
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
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">Kaivincia</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Sistemas', 'Academia', 'Resultados'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00F0FF] transition-colors">
                {item}
              </a>
            ))}
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

      <Footer />

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
