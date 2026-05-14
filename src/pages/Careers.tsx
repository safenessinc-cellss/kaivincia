import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ChevronRight, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { LOGO_FULL } from '../constants/images';

export default function Careers() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Basic query to avoid index requirements during development
    const q = query(
      collection(db, 'jobs'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter active jobs client-side to be safe
      setJobs(allJobs.filter((job: any) => job.status === 'active'));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 font-sans selection:bg-[#00F0FF]/30 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00F0FF]/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
             <img src="/images/logo.png" alt="Kaivincia" className="h-10 w-auto" />
             <span className="text-xl font-black text-white uppercase italic tracking-tighter">Kaivincia</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#00F0FF] transition-colors">Portal de Equipo</Link>
            <Link to="/" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">Inicio</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
             <Sparkles className="w-4 h-4 text-[#00F0FF]" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">Be more than an employee. Be a builder.</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 leading-[0.9]">
            Únete a la <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#00F0FF] to-white italic">Elite Operativa.</span>
          </h1>
          <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto mb-16">
            No buscamos candidatos mediocres. Buscamos el 1% que entiende que el futuro pertenece a quienes dominan la IA y las ventas de alta gama.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500 group-focus-within:text-[#00F0FF] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="¿Qué nodo operativo buscas dominar?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-6 py-6 bg-white/[0.03] border border-white/10 rounded-[2rem] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]/50 focus:border-[#00F0FF]/50 transition-all text-lg shadow-2xl backdrop-blur-xl"
            />
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-20">
        <div className="mb-12 flex items-center justify-between">
           <div>
              <h2 className="text-3xl font-serif font-bold text-white">Vacantes Activas</h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Actualizado en tiempo real • {filteredJobs.length} Posiciones</p>
              </div>
           </div>
        </div>

        {loading ? (
          <div className="text-center py-32">
            <div className="relative h-16 w-16 mx-auto mb-6">
               <div className="absolute inset-0 border-4 border-gray-900 rounded-full" />
               <div className="absolute inset-0 border-4 border-[#00F0FF] rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 italic">Sincronizando con Nucleus Ops...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.map((job) => (
              <motion.div 
                key={job.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] hover:bg-white/[0.04] hover:border-[#00F0FF]/20 transition-all group relative overflow-hidden"
              >
                {/* Job Glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
                        {job.department}
                      </span>
                      {job.isUrgent && (
                        <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/20 animate-pulse">
                          Prioridad Alta
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-3xl font-serif font-bold text-white mb-4 group-hover:text-[#00F0FF] transition-colors leading-none tracking-tight">
                      {job.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2 group-hover:text-gray-300">
                        <MapPin className="w-3 h-3 text-[#00F0FF]" /> {job.location}
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-gray-300">
                        <Briefcase className="w-3 h-3 text-[#00F0FF]" /> {job.type}
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-gray-300">
                        <Clock className="w-3 h-3 text-[#00F0FF]" /> Publicado {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="mt-6 text-gray-400 text-sm leading-relaxed font-medium line-clamp-2 max-w-2xl italic">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <Link 
                      to={`/apply?role=${encodeURIComponent(job.title)}&jobId=${job.id}`}
                      className="inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#00F0FF] hover:text-white transition-all shadow-xl active:scale-95 group/btn"
                    >
                      Postularme <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
            <Briefcase className="mx-auto h-16 w-16 text-gray-800 mb-6" />
            <h3 className="text-2xl font-serif font-bold text-white mb-4">Misión no encontrada</h3>
            <p className="text-gray-500 font-medium mb-10">No hay vacantes abiertas en este cuadrante actualmente.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-[#00F0FF] font-black uppercase tracking-widest text-[10px] hover:underline"
            >
              Reiniciar búsqueda
            </button>
          </div>
        )}
      </main>

      {/* Footer careers */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5 text-center">
         <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4">Kaivincia Ecosistema Operativo v4.0</p>
         <div className="flex justify-center gap-8">
            <Link to="/" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white">Inicio</Link>
            <Link to="/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-white">Portal Privado</Link>
         </div>
      </footer>
    </div>
  );
}
