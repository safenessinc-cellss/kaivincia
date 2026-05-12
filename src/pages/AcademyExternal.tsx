import { useState, useEffect } from 'react';
import { 
  BookOpen, ShoppingCart, DollarSign, Users, TrendingUp, 
  Video, FileText, Award, Plus, ArrowRight, Filter, Play, Star, Zap, Sparkles, Search, ChevronRight, GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AcademyExternal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const guestStatus = localStorage.getItem('kaivincia_guest');
    if (guestStatus === 'true') setIsGuest(true);
  }, []);

  const courses = [
    { 
      id: 1, 
      title: 'Appointment Setter Mastery', 
      price: '$497', 
      rating: 4.9, 
      students: 1240, 
      image: 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&q=80&w=600',
      description: 'Aprende a agendar llamadas de alta calidad para agencias de $10k+.'
    },
    { 
      id: 2, 
      title: 'Growth Agency Systems', 
      price: '$997', 
      rating: 5.0, 
      students: 850, 
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
      description: 'El blueprint completo para escalar tu agencia de servicios a 7 cifras.'
    },
    { 
      id: 3, 
      title: 'Sales Psychology 2.0', 
      price: '$297', 
      rating: 4.8, 
      students: 2100, 
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600',
      description: 'Domina los gatillos mentales que obligan a tus prospectos a decir que sí.'
    }
  ];

  if (isGuest) {
    return (
      <div className="min-h-screen bg-[#05070a] text-gray-100 font-sans selection:bg-[#00F0FF]/30">
        {/* Navbar for Guest */}
        <nav className="fixed w-full z-50 bg-[#05070a]/80 backdrop-blur-xl border-b border-white/5 py-4">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-[#00F0FF] to-[#7c6a30] rounded-lg flex items-center justify-center">
                <Zap className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">Kaivincia</span>
            </Link>
            <Link to="/login" className="px-5 py-2 rounded-full bg-[#00F0FF] text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Acceso Full
            </Link>
          </div>
        </nav>

        <main className="pt-32 pb-20 px-6">
          <header className="max-w-7xl mx-auto mb-20 text-center">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center gap-2 px-4 py-2 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-full mb-6 backdrop-blur-md"
             >
               <Sparkles className="w-4 h-4 text-[#00F0FF]" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">Ecosistema de Formación Élite</span>
             </motion.div>
             <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">Academia Abierta</h1>
             <p className="text-gray-400 max-w-2xl mx-auto font-medium">Estás navegando en Modo Invitado. Accede a los pilares fundamentales para escalar tu agencia.</p>
          </header>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, i) => (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:bg-white/[0.05] transition-all"
              >
                 <div className="h-56 relative overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
                          <Play className="w-5 h-5 fill-current" />
                       </div>
                    </div>
                 </div>
                 <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                       <Star className="w-3 h-3 text-[#00F0FF] fill-current" />
                       <span className="text-[10px] font-black text-white">{course.rating}</span>
                       <span className="text-[10px] text-gray-500">({course.students} Alumnos)</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-4 uppercase tracking-tighter">{course.title}</h4>
                    <p className="text-xs text-gray-400 mb-8 leading-relaxed line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center">
                       <span className="text-2xl font-black text-white">{course.price}</span>
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase text-[#00F0FF] tracking-widest">
                          Preview <ChevronRight className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>

          {/* CTA for Guests */}
          <section className="max-w-4xl mx-auto mt-32 p-12 bg-gradient-to-br from-[#00F0FF] to-[#7c6a30] rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <GraduationCap className="w-12 h-12 text-white mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4 uppercase tracking-tighter italic">¿Listo para el Acceso Completo?</h2>
                <p className="text-white/80 mb-10 font-medium italic">Adquiere una membresía para desbloquear todos los cursos, tutorías en vivo y la bolsa de trabajo interna.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <Link to="/login" className="bg-white text-black px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                      Registrarse Ahora
                   </Link>
                </div>
             </div>
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Users className="w-64 h-64 text-white" />
             </div>
          </section>
        </main>

        <footer className="py-20 px-6 border-t border-white/5 bg-black">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="flex items-center gap-3">
                <Zap className="text-[#00F0FF] w-8 h-8" />
                <span className="text-2xl font-black text-white uppercase italic tracking-tighter">Kaivincia</span>
             </div>
             <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic text-center">
               © 2026 Kaivincia. Estás en navegación limitada.
             </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full bg-white text-gray-900 p-8 pt-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academia Externa (Monetizable)</h2>
          <p className="text-sm text-gray-500 mt-1">Fábrica de talento e ingresos digitales</p>
        </div>
        <button className="bg-[#00F0FF] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo Curso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'dashboard', label: 'Panel Central', icon: TrendingUp },
            { id: 'cursos', label: 'Gestión de Cursos', icon: BookOpen },
            { id: 'alumnos', label: 'Alumnos y Certificaciones', icon: Award },
            { id: 'funnel', label: 'Embudos de Venta', icon: Filter },
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
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Ingresos Digitales (Mes)</p>
                  <p className="text-2xl font-bold text-green-600">$12,450</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Alumnos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">342</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Nuevas Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">45</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Talento Reclutado</p>
                  <p className="text-2xl font-bold text-[#00F0FF]">8</p>
                  <p className="text-xs text-gray-500 mt-1">Pasaron al equipo interno</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cursos Vendidos</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Curso Appointment Setter</p>
                          <p className="text-xs text-gray-500">145 alumnos</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">$4,350</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Ventas 10X Adaptado</p>
                          <p className="text-xs text-gray-500">89 alumnos</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">$3,560</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Fábrica de Talento</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    El sistema evalúa automáticamente a los alumnos destacados. Puedes invitarlos a trabajar en tu Call Center con un clic.
                  </p>
                  <button className="text-[#00F0FF] font-medium hover:underline flex items-center gap-1">
                    Ver alumnos certificados <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {['cursos', 'alumnos', 'funnel'].includes(activeTab) && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 capitalize">{activeTab.replace('-', ' ')}</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Módulo en construcción.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

