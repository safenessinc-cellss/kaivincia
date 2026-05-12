import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Trello, CheckSquare, MessageSquare, LogOut, Wallet,
  ShieldAlert, BookOpen, MonitorPlay, PhoneCall, Briefcase, Calculator,
  Settings, Megaphone, FolderKanban, BarChart3, UserCircle, Users2, Calendar,
  UserPlus, FileText, Receipt, GraduationCap, ShoppingCart, ChevronRight, Home,
  ChevronDown, ChevronUp, Search, Activity, Zap, Award, Bell, Eye, EyeOff, PanelLeftClose, PanelLeftOpen,
  BrainCircuit, Navigation, DollarSign, HelpCircle, HardDrive, ClipboardCheck,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LOGO_FULL, LOGO_ICON } from '../constants/images';
import Logo from './Logo';
import CommandBar from './CommandBar';
import NotificationCenter from './NotificationCenter';

export default function CRMLayout({ userData }: { userData: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [ceoMode, setCeoMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Módulo Core': true,
    'Módulo de Talento': false,
    'Módulo Financiero': false,
    'Módulo de Estrategia': false,
    'Academia Kaivincia': true,
    'Portales': false,
    'Configuración': false
  });

  const userRole = userData?.role || 'user';
  const isAdminOrFin = ['superadmin', 'admin', 'billing', 'accounting'].includes(userRole);
  const isSuperAdmin = userRole === 'superadmin';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandBarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const toggleGroup = (title: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
    setExpandedGroups(prev => ({
      ...prev,
      [title]: prev[title] === undefined ? true : !prev[title]
    }));
  };

  const menuGroups = useMemo(() => {
    const groups = [
      {
        title: 'SISTEMA NERVIOSO',
        items: [
          { name: 'Nervous System', href: '/crm/nervous', icon: BrainCircuit, highlight: true, color: 'text-[#22D3EE]' },
          { name: 'Command Center', href: '/crm/dashboard', icon: Home, highlight: true, color: 'text-cyan-500' },
          { name: 'Neural Chat', href: '/crm/chat', icon: MessageSquare, badge: '9+', color: 'text-[#A855F7]' },
          { name: 'Automatizaciones', href: '/crm/automations', icon: Zap, color: 'text-amber-500' },
        ]
      },
      {
        title: 'GESTIÓN & OPERACIONES',
        items: [
          { name: 'Clientes 360', href: '/crm/client-management', icon: Users, color: 'text-blue-500' },
          { name: 'Helpdesk CX', href: '/crm/helpdesk', icon: HelpCircle, color: 'text-[#22D3EE]' },
          { name: 'Sala de Control', href: '/crm/operations', icon: Activity, color: 'text-emerald-500' },
          { name: 'Despliegue Táctico', href: '/crm/tactical', icon: Navigation, color: 'text-cyan-400' },
          { name: 'Pipeline B2B', href: '/crm/pipeline', icon: Trello, color: 'text-[#00F0FF]' },
          { name: 'Proyectos', href: '/crm/projects', icon: FolderKanban, color: 'text-orange-500' },
        ]
      },
      {
        title: 'TALENTO & SGI',
        items: [
          { name: 'Academia Interna', href: '/crm/academy-internal', icon: GraduationCap, color: 'text-purple-500' },
          { name: 'Skill Map', href: '/crm/team', icon: Briefcase, color: 'text-indigo-400' },
          { name: 'Reclutamiento AI', href: '/crm/recruitment', icon: UserPlus, color: 'text-pink-500' },
          { name: 'Manuales', href: '/crm/manuales', icon: BookOpen, color: 'text-emerald-400' },
          { name: 'Turs', href: '/crm/turs', icon: FileText, color: 'text-orange-400' },
          { name: 'Drive SGI', href: '/crm/drive', icon: HardDrive, color: 'text-indigo-500' },
          { name: 'Auditorías SGI', href: '/crm/audits', icon: ClipboardCheck, color: 'text-orange-500' },
        ]
      },
      {
        title: 'FINANZAS & ESTRATEGIA',
        hidden: !isAdminOrFin,
        items: [
          { name: 'Capital Flow', href: '/crm/commissions', icon: DollarSign, color: 'text-emerald-400' },
          { name: 'Facturación GPS', href: '/crm/billing', icon: Receipt, color: 'text-cyan-600' },
          { name: 'KPIs Estratégicos', href: '/crm/reports', icon: BarChart3, color: 'text-white' },
          { name: 'Estrategia Intel', href: '/crm/strategy-blog', icon: BrainCircuit, color: 'text-amber-300' },
        ]
      },
      {
        title: 'PORTALES & EXTERNOS',
        items: [
          { name: 'Portal Clientes', href: '/crm/client-portal', icon: UserCircle, color: 'text-gray-400' },
          { name: 'Academy Store', href: '/crm/digital-products', icon: ShoppingCart, color: 'text-gray-400' },
        ]
      }
    ];

    if (isSuperAdmin) {
      groups.push({
        title: 'Configuración',
        items: [
          { name: 'SuperAdmin', href: '/crm/superadmin', icon: ShieldAlert },
          { name: 'Security Center', href: '/crm/security', icon: ShieldCheck, color: 'text-[#FACC15]' },
          { name: 'Automatizaciones', href: '/crm/automations', icon: Zap },
        ]
      } as any);
    }

    return groups.filter(g => !g.hidden);
  }, [userRole, isAdminOrFin, isSuperAdmin]);

  const filteredMenuGroups = useMemo(() => {
    if (!menuSearch) return menuGroups;
    const lowerSearch = menuSearch.toLowerCase();
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => item.name.toLowerCase().includes(lowerSearch))
    })).filter(group => group.items.length > 0);
  }, [menuGroups, menuSearch]);

  // Generate Breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    if (pathnames.length === 1 && pathnames[0] === 'crm') {
      return [{ name: 'Inicio', href: '/crm' }];
    }

    const breadcrumbs = [{ name: 'Inicio', href: '/crm' }];
    let currentPath = '';
    const allItems = menuGroups.flatMap(g => g.items);

    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      const navItem = allItems.find(item => item.href === currentPath);
      
      if (navItem) {
        breadcrumbs.push({ name: navItem.name, href: currentPath });
      } else if (name !== 'crm') {
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
        breadcrumbs.push({ name: formattedName, href: currentPath });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/images/portada.jpg" alt="Portada" className="w-full h-full object-cover opacity-[0.03] grayscale mix-blend-multiply" />
      </div>
      {/* Sidebar */}
      <div className={`bg-[#0a0a0a] text-gray-300 border-r border-gray-800 flex flex-col h-screen transition-all duration-300 relative z-10 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
          {!isSidebarCollapsed ? (
            <Logo />
          ) : (
            <Logo iconOnly />
          )}
        </div>

        {/* Quick Access Icons */}
        {!isSidebarCollapsed && (
          <div className="flex items-center justify-around p-3 border-b border-gray-800 shrink-0 bg-[#111]">
            <Link to="/crm/chat" className="p-2 rounded-lg hover:bg-gray-800 hover:text-[#00F0FF] transition-colors relative group" title="Chat Interno">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <Link to="/crm/calls" className="p-2 rounded-lg hover:bg-gray-800 hover:text-[#00F0FF] transition-colors group" title="Sistema de Llamadas">
              <PhoneCall className="w-5 h-5" />
            </Link>
            <Link to="/crm/tasks" className="p-2 rounded-lg hover:bg-gray-800 hover:text-[#00F0FF] transition-colors group" title="Mis Tareas">
              <CheckSquare className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Menu Search */}
        {!isSidebarCollapsed && (
          <div className="p-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar módulo..." 
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-colors"
              />
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-800">
          {filteredMenuGroups.map((group, idx) => {
            const isExpanded = isSidebarCollapsed ? false : (menuSearch ? true : expandedGroups[group.title] !== false);
            return (
              <div key={idx} className={`mb-2 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
                {!isSidebarCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors text-gray-500 hover:text-gray-300"
                  >
                    <span>{group.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {(isExpanded || isSidebarCollapsed) && (
                  <nav className={`space-y-1 ${!isSidebarCollapsed ? 'mt-1' : ''}`}>
                    {group.items.map((item: any) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          title={isSidebarCollapsed ? item.name : undefined}
                          className={`flex items-center group relative overflow-hidden ${isSidebarCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-4 py-2.5'} rounded-2xl text-sm font-medium transition-all duration-300 ${
                            isActive 
                              ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                              : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
                          } ${item.highlight && !isActive ? 'text-gray-300 font-bold' : ''}`}
                        >
                          <item.icon className={`${!isSidebarCollapsed ? 'mr-3' : ''} h-4 w-4 shrink-0 transition-transform group-hover:scale-125 ${
                            isActive 
                              ? item.color || 'text-[#00F0FF]' 
                              : item.color || 'text-gray-600'
                          }`} />
                          {!isSidebarCollapsed && (
                            <div className="flex-1 flex justify-between items-center mr-1">
                              <span className="text-[10px] uppercase font-black tracking-widest">{item.name}</span>
                              {item.badge && (
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                                  item.badge === 'LIVE' ? 'bg-cyan-500 text-black animate-pulse' : 'bg-[#A855F7] text-white'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                          {isActive && !isSidebarCollapsed && (
                            <motion.div 
                              layoutId="nav-glow"
                              className="absolute left-0 w-1 h-4 bg-[#00F0FF] rounded-r-full"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-800 shrink-0 bg-[#111]">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-4 px-2">
                {userData?.avatarUrl ? (
                  <img src={userData.avatarUrl} alt={userData?.name} className="h-10 w-10 rounded-full object-cover border border-gray-700 shadow-lg" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-yellow-700 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                    {userData?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{userData?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-gray-800 text-[#00F0FF] px-1.5 py-0.5 rounded border border-gray-700 uppercase font-black tracking-tighter shadow-sm">
                      {userData?.role || 'User'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${userData?.status === 'active' ? 'bg-green-500' : 'bg-cyan-500/100'}`}></span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/crm/user-portal')}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-400 bg-gray-900 rounded-lg hover:bg-gray-800 hover:text-white transition-colors border border-gray-800"
                >
                  <UserCircle className="mr-2 h-3.5 w-3.5" />
                  Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-red-400 bg-gray-900 rounded-lg hover:bg-red-900/30 hover:text-red-300 transition-colors border border-gray-800"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Salir
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt={userData?.name} className="h-10 w-10 rounded-full object-cover shadow-lg cursor-pointer border border-gray-700" onClick={() => navigate('/crm/user-portal')} title="Perfil" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-yellow-700 flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer" onClick={() => navigate('/crm/user-portal')} title="Perfil">
                  {userData?.name?.charAt(0) || 'U'}
                </div>
              )}
              <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors mt-2"
                  title="Salir"
                >
                  <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex flex-1 items-center gap-4">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={isSidebarCollapsed ? "Expandir Menú" : "Colapsar Menú"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            
            <nav className="hidden sm:flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center">
                    {index === 0 ? (
                      <Link to={crumb.href} className="text-gray-400 hover:text-gray-500">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">Inicio</span>
                      </Link>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                        <Link 
                          to={crumb.href} 
                          className={`text-sm font-medium ${
                            index === breadcrumbs.length - 1 
                              ? 'text-gray-900 pointer-events-none' 
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                        >
                          {crumb.name}
                        </Link>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* CEO MODE SWITCH */}
            {isAdminOrFin && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500">CEO Mode</span>
                <button
                  type="button"
                  onClick={() => setCeoMode(!ceoMode)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 ${
                    ceoMode ? 'bg-[#00F0FF]' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={ceoMode}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      ceoMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {ceoMode ? <Eye className="w-3 h-3 text-[#00F0FF]" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
                  </span>
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsCommandBarOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all hover:border-[#00F0FF] group sm:min-w-[250px]"
            >
              <Search className="w-4 h-4 group-hover:text-[#00F0FF]" />
              <span className="flex-1 text-left hidden sm:inline">Buscar o comando...</span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded">⌘K</kbd>
            </button>

            <div className="hidden sm:block h-8 w-px bg-gray-200"></div>

            <NotificationCenter />
            
            <button className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200 flex flex-shrink-0 items-center justify-center hover:bg-gray-100 transition-colors hidden sm:flex">
              <Zap className="w-5 h-5 text-[#00F0FF]" />
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 sm:p-8 bg-transparent relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet context={{ userData, ceoMode }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandBar isOpen={isCommandBarOpen} onClose={() => setIsCommandBarOpen(false)} />
    </div>
  );
}
