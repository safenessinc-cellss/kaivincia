import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Quote, Calendar, User, ArrowRight, TrendingUp, 
  Target, Sparkles, Zap, ChevronRight, Search, Share2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StrategyBlog() {
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const posts = [
    {
      title: 'El Fin de los Embudos Lineales: Bienvenido al Ecosistema 2026',
      excerpt: 'Por qué tu agencia está muriendo si sigues usando ClickFunnels clásicos.',
      category: 'Estrategia',
      date: '24 Abr, 2026',
      readTime: '5 min',
      author: 'AI Strategist',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      content: 'Los embudos lineales tradicionales ya no son suficientes para captar la atención. En 2026, la interacción requiere un ecosistema omnicanal, impulsado por IA, que entienda el comportamiento del usuario en tiempo real y ofrezca experiencias personalizadas y adaptables. Deja atrás el modelo estricto de ClickFunnels y permite que tus usuarios fluyan a través de caminos de contenido interactivo.'
    },
    {
      title: 'Monetizando el Conocimiento: La Era de la Academia Corporativa',
      excerpt: 'Cómo transformar tus procesos internos en activos digitales de $100k.',
      category: 'Crecimiento',
      date: '22 Abr, 2026',
      readTime: '8 min',
      author: 'Founder',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
      content: 'El conocimiento interno de tu empresa vale oro. Al empaquetarlo en una academia corporativa, no solo disciplinas a tu equipo, sino que puedes licenciar tus métodos y convertirlos en un brazo extremadamente rentable de tu negocio. Descubre cómo documentar tus SOPs, crear un programa de certificación y comercializarlo como un producto.'
    },
    {
      title: 'Appointment Setting 3.0: Humano + IA',
      excerpt: 'La combinación letal que está duplicando el cierre de llamadas en Kaivincia.',
      category: 'Ventas',
      date: '20 Abr, 2026',
      readTime: '6 min',
      author: 'Head of Sales',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
      content: 'La prospección 100% manual es ineficiente y la 100% automatizada espanta prospectos por su falta de empatía. El setting 3.0 integra la inteligencia artificial para calificar y generar rapport inicial, mientras los humanos toman la interacción en el punto de máxima intención.'
    }
  ];

  const handleShare = (e: React.MouseEvent, postTitle: string) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        text: `Lee más acerca de: ${postTitle}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Funcionalidad de compartir no está soportada en este navegador, pero puedes copiar el enlace.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 py-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md text-[#00F0FF] text-[10px] font-black uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" /> Inteligencia de Mercado
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">Blog de Estrategia Elite</h1>
          <p className="text-gray-400 max-w-2xl mx-auto font-medium">Contenido exclusivo para invitados y clientes sobre la nueva economía de agencias.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {posts.map((post, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0, 240, 255, 0.1)' }}
               onClick={() => setSelectedPost(post)}
               className="relative overflow-hidden rounded-[2.5rem] bg-black border border-white/5 group cursor-pointer transition-all duration-300 min-h-[400px] flex flex-col justify-end"
             >
                {/* Background Image & Overlay */}
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
                
                <div className="relative z-10 p-8 pt-20">
                  <div className="flex justify-between items-center mb-4">
                     <span className="px-3 py-1 bg-[#00F0FF]/20 text-[#00F0FF] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#00F0FF]/30 backdrop-blur-md">
                        {post.category}
                     </span>
                     <button 
                       onClick={(e) => handleShare(e, post.title)}
                       className="p-2 bg-white/10 rounded-full hover:bg-[#00F0FF]/20 text-white hover:text-[#00F0FF] transition-colors backdrop-blur-md"
                     >
                       <Share2 className="w-4 h-4" />
                     </button>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#00F0FF] transition-colors leading-[1.2] drop-shadow-lg">{post.title}</h3>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed font-medium drop-shadow-md">{post.excerpt}</p>
                  
                  <div className="flex justify-between items-center pt-5 border-t border-white/10">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 backdrop-blur-md">
                           <User className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">{post.author}</span>
                          <span className="text-[9px] font-bold text-gray-400 tracking-widest">{post.date}</span>
                        </div>
                     </div>
                     <span className="flex items-center gap-2 text-[10px] font-black uppercase text-[#00F0FF] tracking-widest group-hover:translate-x-1 transition-transform drop-shadow-md">
                        Leer <ArrowRight className="w-3 h-3" />
                     </span>
                  </div>
                </div>
             </motion.div>
           ))}
        </div>

        <div className="mt-20 p-12 bg-gradient-to-br from-[#00F0FF] to-[#7c6a30] rounded-[3rem] text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="relative z-10 flex flex-col items-center">
              <Zap className="w-12 h-12 text-white mb-6 animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 uppercase tracking-tighter italic">¿Quieres aplicar estos sistemas?</h2>
              <p className="text-white/80 max-w-xl mb-8 font-medium italic">Accede al ecosistema completo y deja de ser un esclavo de tu propia operación.</p>
              <Link to="/apply" className="bg-white text-black px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform">
                 Agendar Auditaría de Sistemas
              </Link>
           </div>
           <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
              <Target className="w-64 h-64 text-white" />
           </div>
        </div>
      </div>

      {/* Modal for full post content */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B0E14] border border-[#1E293B] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative h-64 shrink-0">
                <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] to-transparent" />
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="px-3 py-1 bg-[#00F0FF] text-black rounded-full text-[9px] font-black uppercase tracking-widest mb-3 inline-block">
                    {selectedPost.category}
                  </span>
                  <h2 className="text-3xl font-serif font-bold text-white leading-tight">{selectedPost.title}</h2>
                </div>
              </div>
              
              <div className="p-8 overflow-y-auto">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                  <div className="h-10 w-10 rounded-full bg-[#00F0FF]/10 flex items-center justify-center text-[#00F0FF]">
                     <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{selectedPost.author}</p>
                    <p className="text-xs text-gray-400 font-medium">{selectedPost.date} • {selectedPost.readTime} de lectura</p>
                  </div>
                  <div className="ml-auto">
                    <button 
                      onClick={(e) => handleShare(e, selectedPost.title)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-[#00F0FF]/10 text-gray-300 hover:text-[#00F0FF] transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                      <Share2 className="w-4 h-4" /> Compartir
                    </button>
                  </div>
                </div>
                
                <div className="prose prose-invert prose-p:text-gray-300 prose-p:leading-relaxed max-w-none">
                  <p className="text-lg text-gray-200 font-medium italic mb-6 border-l-4 border-[#00F0FF] pl-4">
                    {selectedPost.excerpt}
                  </p>
                  <p>
                    {selectedPost.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
