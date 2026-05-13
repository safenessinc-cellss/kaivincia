import { Link } from 'react-router-dom';
import { Zap, Globe, Mail, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-[#05070a] border-t border-white/5 pt-24 pb-12 px-6 overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00F0FF]/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
              <span className="text-2xl font-black text-white uppercase italic tracking-tighter">Kaivincia</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
              El sistema operativo para agencias de élite. Fusionamos inteligencia operativa con formación de alto rendimiento.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/30 transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Ecosistema */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Ecosistema</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/crm/dashboard" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Master CRM</Link>
              </li>
              <li>
                <Link to="/guest-academy" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Academia Abierta</Link>
              </li>
              <li>
                <Link to="/pipeline" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Pipeline IA</Link>
              </li>
              <li>
                <Link to="/apply" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Agendar Demo</Link>
              </li>
            </ul>
          </div>

          {/* Corporativo */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Corporativo</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/careers" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Carreras</Link>
              </li>
              <li>
                <Link to="/strategy-blog" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Blog Estratégico</Link>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Partnerships</a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-[#00F0FF] text-xs font-bold uppercase transition-colors tracking-widest">Prensa</a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8">Contacto</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-[#00F0FF] shrink-0" />
                <span className="text-gray-400 text-xs font-medium">Soporte Global 24/7 impulsado por IA.</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#00F0FF] shrink-0" />
                <a href="mailto:admin@kaivincia.com" className="text-gray-400 text-xs font-medium hover:text-white transition-colors">admin@kaivincia.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
            © 2026 Kaivincia Corp. Todos los derechos reservados.by Safeness.inc.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Términos</a>
            <a href="#" className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
