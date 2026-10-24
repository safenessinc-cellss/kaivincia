import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, BookOpen, DollarSign, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/crm/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/crm/client-management', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { path: '/crm/team', label: 'Equipo', icon: <Briefcase className="w-5 h-5" /> },
    { path: '/crm/academy-internal', label: 'Academia', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/crm/billing', label: 'Facturación', icon: <DollarSign className="w-5 h-5" /> },
    { path: '/crm/settings', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-[#0B0E14] border-r border-white/10 flex flex-col h-screen sticky top-0">
      {/* LOGO NO MENU LATERAL */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-white/10">
        <div className="h-10 w-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
          <img 
            src="/images/logo.png" 
            alt="Kaivincia Corp" 
            className="h-8 w-8 object-contain"
          />
        </div>
        <span className="text-xl font-black text-white uppercase tracking-tighter italic">Kaivincia</span>
      </div>

      {/* MENU ITEMS */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              location.pathname === item.path
                ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* FOOTER DO MENU */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
