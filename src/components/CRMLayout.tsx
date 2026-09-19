import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Trello, CheckSquare, MessageSquare, LogOut, Wallet,
  ShieldAlert, BookOpen, MonitorPlay, PhoneCall, Briefcase, Calculator,
  Settings, Megaphone, FolderKanban, BarChart3, UserCircle, Users2, Calendar,
  UserPlus, FileText, Receipt, GraduationCap, ShoppingCart, ChevronRight, Home,
  ChevronDown, ChevronUp, Search, Activity, Zap, Award, Bell, Eye, EyeOff, PanelLeftClose, PanelLeftOpen,
  BrainCircuit, Navigation, DollarSign, HelpCircle, HardDrive, ClipboardCheck,
  ShieldCheck, ArrowLeft, LayoutTemplate, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LOGO_FULL, LOGO_ICON } from '../constants/images';
import CommandBar from './CommandBar';
import HelpDrawer from './help/HelpDrawer';
import NotificationCenter from './NotificationCenter';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

export default function CRMLayout({ userData }: { userData: any }) {
  const { t } = useLanguage();
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
    // Definición de grupos de navegación base traducibles
    const academyGroup = {
      title: t('nav.groups.academy', 'ACADEMIA KAIVINCIA'),
      items: [
        { name: t('nav.academy_internal', 'Cursos & Formación'), href: '/crm/academy-internal', icon: GraduationCap, color: 'text-purple-500' },
        { name: t('nav.sop_manuals', 'Manuales de Élite'), href: '/crm/manuales', icon: BookOpen, color: 'text-emerald-400' },
      ]
    };

    const coreGroup = {
      title: t('nav.groups.nervous', 'SISTEMA NERVIOSO'),
      items: [
        { name: t('nav.nervous_system', 'Nervous System'), href: '/crm/nervous', icon: BrainCircuit, highlight: true, color: 'text-[#22D3EE]' },
        { name: t('nav.master_dashboard', 'Panel Maestro'), href: '/crm/dashboard', icon: Home, highlight: true, color: 'text-cyan-500' },
        { name: t('nav.neural_chat', 'Neural Chat'), href: '/crm/chat', icon: MessageSquare, badge: '9+', color: 'text-[#A855F7]' },
        { name: t('nav.members_roles', 'Miembros / Roles'), href: '/crm/chat?view=contacts', icon: Users, color: 'text-emerald-400' },
      ]
    };

    const strategyGroup = {
      title: t('nav.groups.strategy', 'ESTRATEGIA & KPIS'),
      items: [
        { name: t('nav.strategic_kpis', 'KPIs Estratégicos'), href: '/crm/reports', icon: BarChart3, color: 'text-white' },
        { name: t('nav.strategic_report', 'Informe Predictivo'), href: '/crm/strategic-report', icon: Activity, color: 'text-cyan-400' },
        { name: t('nav.strategy_intel', 'Estrategia Intel'), href: '/crm/strategy-blog', icon: BrainCircuit, color: 'text-amber-300' },
      ]
    };

    const clientGroup = {
      title: t('nav.groups.clients', 'ECOSISTEMA DE CLIENTES'),
      items: [
        { name: t('nav.pipeline', 'Marketing (Oportunidades)'), href: '/crm/pipeline', icon: Navigation, highlight: true, color: 'text-[#00F0FF]', badge: 'Meta Ads' },
        { name: t('nav.voip_softphone', 'Discador & VoIP Softphone'), href: '/crm/calls', icon: PhoneCall, highlight: true, color: 'text-emerald-400' },
        { name: t('nav.clients', 'Base de Clientes'), href: '/crm/clients', icon: Users, color: 'text-emerald-500' },
        { name: t('nav.calendar', 'Agenda & Reuniones'), href: '/crm/calendar', icon: Calendar, color: 'text-cyan-400' },
        { name: t('nav.debt_collection', 'Cobranza GPS'), href: '/crm/cobranza', icon: DollarSign, color: 'text-amber-500' },
      ]
    };

    const telemarketingGroup = {
      title: t('nav.groups.tlmk', 'TELEMARKETING & VENTAS (TLMK)'),
      items: [
        { name: t('nav.pipeline', 'Marketing (Oportunidades)'), href: '/crm/pipeline', icon: Navigation, highlight: true, color: 'text-[#00F0FF]', badge: 'Meta Ads' },
        { name: t('nav.voip_softphone', 'Discador & VoIP Softphone'), href: '/crm/calls', icon: PhoneCall, highlight: true, color: 'text-emerald-400' },
        { name: t('nav.calendar', 'Agenda & Reuniones'), href: '/crm/calendar', icon: Calendar, color: 'text-cyan-400' },
        { name: t('nav.clients', 'Base de Clientes'), href: '/crm/clients', icon: Users, color: 'text-emerald-500' },
        { name: t('nav.debt_collection', 'Cobranza GPS & Feedback'), href: '/crm/cobranza', icon: DollarSign, color: 'text-amber-400' },
      ]
    };

    const operationsGroup = {
      title: t('nav.groups.operations', 'OPERACIONES & PROYECTOS'),
      items: [
        { name: t('nav.tasks', 'Gestión de Tareas'), href: '/crm/tasks', icon: ClipboardCheck, color: 'text-blue-400' },
        { name: t('nav.projects', 'Proyectos Activos'), href: '/crm/projects', icon: FolderKanban, color: 'text-orange-500' },
        { name: t('nav.form_templates', 'Plantillas de Ficha'), href: '/crm/form-templates', icon: LayoutTemplate, color: 'text-[#00F0FF]' },
        { name: t('nav.integrations', 'Integraciones Externas'), href: '/crm/integrations', icon: Share2, color: 'text-violet-400' },
        { name: t('nav.sgi_drive', 'SGI Drive'), href: '/crm/drive', icon: HardDrive, color: 'text-indigo-500' },
      ]
    };

    const talentGroup = {
      title: t('nav.groups.talent', 'MÓDULO DE TALENTO'),
      items: [
        { name: t('nav.recruitment', 'Reclutamiento AI'), href: '/crm/recruitment', icon: UserPlus, color: 'text-pink-500' },
        { name: t('nav.team', 'Gestión de Equipo'), href: '/crm/team', icon: Users2, color: 'text-orange-500' },
        { name: t('nav.payroll', 'Módulo Nómina'), href: '/crm/payroll', icon: DollarSign, color: 'text-green-500' },
      ]
    };

    const portalGroup = {
      title: t('nav.groups.portal', 'PORTAL PERSONAL'),
      items: [
        { name: t('nav.my_portal', 'Mi Portal'), href: '/crm/user-portal', icon: UserCircle, color: 'text-gray-400' },
        { name: t('nav.billing', 'Facturación GPS'), href: '/crm/billing', icon: Receipt, color: 'text-cyan-600' },
      ]
    };

    // Lógica de menús según el Rol
    if (userRole === 'alumno') {
      return [
        academyGroup,
        {
          title: t('nav.groups.portal', 'PAGOS & PORTAL'),
          items: [
            { name: t('nav.my_portal', 'Mi Portal'), href: '/crm/user-portal', icon: UserCircle, color: 'text-gray-400' },
            { name: t('nav.billing', 'Pagos y Facturas'), href: '/crm/billing', icon: Receipt, color: 'text-cyan-600' },
            { name: t('nav.digital_products', 'Academy Store'), href: '/crm/digital-products', icon: ShoppingCart, color: 'text-gray-400' },
          ]
        }
      ];
    }

    if (['tlmk', 'ventas', 'setter', 'closer', 'telemarketing', 'agent'].includes(userRole)) {
      return [telemarketingGroup, coreGroup, portalGroup];
    }

    if (userRole === 'collaborator') {
      return [
        telemarketingGroup,
        {
          title: t('nav.groups.operations', 'MI TRABAJO'),
          items: [
            { name: t('nav.master_dashboard', 'Panel Operativo'), href: '/crm/dashboard', icon: Home, color: 'text-cyan-500' },
            { name: t('nav.tasks', 'Tareas Asignadas'), href: '/crm/tasks', icon: ClipboardCheck, color: 'text-blue-400' },
            { name: t('nav.neural_chat', 'Neural Chat'), href: '/crm/chat', icon: MessageSquare, color: 'text-[#A855F7]' },
            { name: t('nav.sop_manuals', 'Manuales SOP'), href: '/crm/manuales', icon: BookOpen, color: 'text-emerald-400' },
          ]
        },
        portalGroup
      ];
    }

    if (userRole === 'rrhh') {
      return [coreGroup, talentGroup, academyGroup, portalGroup];
    }

    if (userRole === 'gestor') {
      return [telemarketingGroup, coreGroup, operationsGroup, clientGroup, strategyGroup, portalGroup];
    }

    if (userRole === 'ceo' || userRole === 'superadmin') {
      const groups = [
        telemarketingGroup,
        coreGroup,
        clientGroup,
        operationsGroup,
        talentGroup,
        strategyGroup,
        academyGroup,
        portalGroup,
      ];

      if (isSuperAdmin) {
        groups.push({
          title: t('nav.groups.config', 'CONFIGURACIÓN'),
          items: [
            { name: t('nav.superadmin', 'SuperAdmin'), href: '/crm/superadmin', icon: ShieldAlert },
            { name: t('nav.security_center', 'Security Center'), href: '/crm/security', icon: ShieldCheck, color: 'text-[#FACC15]' },
            { name: t('nav.automations', 'Automatizaciones'), href: '/crm/automations', icon: Zap },
            { name: t('nav.form_templates', 'Plantillas de Ficha'), href: '/crm/form-templates', icon: LayoutTemplate, color: 'text-[#00F0FF]' },
            { name: t('nav.integrations', 'Integraciones Externas'), href: '/crm/integrations', icon: Share2, color: 'text-violet-400' },
          ]
        } as any);
      }
      return groups;
    }

    // Usuario básico o sin rol/pending
    return [
      telemarketingGroup,
      {
        title: t('common.welcome', 'BIENVENIDO'),
        items: [
          { name: t('nav.my_portal', 'Mi Portal'), href: '/crm/user-portal', icon: UserCircle, color: 'text-gray-400' },
          { name: t('nav.helpdesk', 'Centro de Soporte'), href: '/crm/helpdesk', icon: HelpCircle, color: 'text-cyan-400' },
        ]
      }
    ];
  }, [userRole, isAdminOrFin, isSuperAdmin, t]);

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
      return [{ name: t('header.home', 'Inicio'), href: '/crm' }];
    }

    const breadcrumbs = [{ name: t('header.home', 'Inicio'), href: '/crm' }];
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
            <img 
              src={LOGO_FULL}
              alt="Kaivincia Logo" 
              className="h-8 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={LOGO_FULL}
              alt="Kaivincia Logo" 
              className="h-8 w-8 object-contain mx-auto"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Quick Access Icons */}
        {!isSidebarCollapsed && (
          <div className="flex items-center justify-around p-3 border-b border-gray-800 shrink-0 bg-[#111]">
            <Link to="/crm/chat" className="p-2 rounded-lg hover:bg-gray-800 hover:text-[#00F0FF] transition-colors relative group" title={t('nav.neural_chat', 'Chat Interno')}>
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <Link to="/crm/calls" className="p-2 rounded-lg hover:bg-gray-800 hover:text-[#00F0FF] transition-colors group" title={t('nav.voip_softphone', 'Sistema de Llamadas')}>
              <PhoneCall className="w-5 h-5" />
            </Link>
            <Link to="/crm/tasks" className="p-2 rounded-lg hover:bg-gray-800 hover:text-[#00F0FF] transition-colors group" title={t('nav.tasks', 'Mis Tareas')}>
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
                placeholder={t('header.search_placeholder', 'Buscar módulo...')} 
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
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-400 bg-gray-900 rounded-lg hover:bg-gray-800 hover:text-white transition-colors border border-gray-800 cursor-pointer"
                >
                  <UserCircle className="mr-2 h-3.5 w-3.5" />
                  {t('header.profile', 'Perfil')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-red-400 bg-gray-900 rounded-lg hover:bg-red-900/30 hover:text-red-300 transition-colors border border-gray-800 cursor-pointer"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  {t('header.logout', 'Salir')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt={userData?.name} className="h-10 w-10 rounded-full object-cover shadow-lg cursor-pointer border border-gray-700" onClick={() => navigate('/crm/user-portal')} title={t('header.profile', 'Perfil')} />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-yellow-700 flex items-center justify-center text-sm font-bold text-white shadow-lg cursor-pointer" onClick={() => navigate('/crm/user-portal')} title={t('header.profile', 'Perfil')}>
                  {userData?.name?.charAt(0) || 'U'}
                </div>
              )}
              <button
                  onClick={handleLogout}
                  className="p-2 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors mt-2 cursor-pointer"
                  title={t('header.logout', 'Salir')}
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
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title={isSidebarCollapsed ? t('header.expand_menu', 'Expandir Menú') : t('header.collapse_menu', 'Colapsar Menú')}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Componente de Navegación Histórica */}
            <div className="flex items-center gap-1.5" id="historical-navigation">
              <button 
                id="btn-historical-back"
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 active:bg-gray-200 border border-gray-200 rounded-xl transition-all font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                title={t('header.back', 'Volver a la página anterior')}
                aria-label="Volver"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
                <span className="hidden sm:inline font-black tracking-tight uppercase text-[11px]">{t('header.back', 'Volver')}</span>
              </button>
            </div>
            
            <nav className="hidden sm:flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href} className="flex items-center">
                    {index === 0 ? (
                      <Link to={crumb.href} className="text-gray-400 hover:text-gray-500">
                        <Home className="h-4 w-4" />
                        <span className="sr-only">{t('header.home', 'Inicio')}</span>
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

          <div className="flex items-center gap-3 sm:gap-4">
            {/* CEO MODE SWITCH */}
            {isAdminOrFin && (
              <div className="flex items-center gap-2 mr-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500 hidden xl:inline">{t('header.ceo_mode', 'CEO Mode')}</span>
                <button
                  type="button"
                  onClick={() => setCeoMode(!ceoMode)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 ${
                    ceoMode ? 'bg-[#00F0FF]' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={ceoMode}
                  title={t('header.ceo_mode', 'Modo CEO')}
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

            {/* QUICK OPERATIONAL SHORTCUTS FOR TLMK */}
            <button 
              onClick={() => navigate('/crm/calls?dialer=open')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title={t('voip.title', 'Abrir Discador Telefónico VoIP')}
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden md:inline">{t('header.voip_shortcut', 'Discador VoIP')}</span>
            </button>

            <button 
              onClick={() => navigate('/crm/pipeline')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-cyan-700 hover:bg-[#00F0FF] hover:text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title={t('pipeline.title', 'Abrir Módulo de Marketing & Oportunidades')}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t('header.pipeline_shortcut', 'Marketing')}</span>
            </button>

            <button 
              onClick={() => setIsCommandBarOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all hover:border-[#00F0FF] group sm:min-w-[180px] cursor-pointer"
            >
              <Search className="w-4 h-4 group-hover:text-[#00F0FF]" />
              <span className="flex-1 text-left hidden sm:inline">{t('header.search_placeholder', 'Buscar o comando...')}</span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded">⌘K</kbd>
            </button>

            <div className="hidden sm:block h-8 w-px bg-gray-200"></div>

            {/* Language Selector in Header */}
            <LanguageSelector theme="light" />

            <NotificationCenter />
            
            {isSuperAdmin && (
              <button 
                onClick={() => navigate('/crm/superadmin')}
                className="h-10 w-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex flex-shrink-0 items-center justify-center hover:bg-[#00F0FF]/20 transition-colors group cursor-pointer"
                title={t('nav.superadmin', 'Panel Maestro')}
              >
                <Settings className="w-5 h-5 text-[#00F0FF] group-hover:rotate-90 transition-transform duration-500" />
              </button>
            )}

            <button 
              onClick={() => navigate('/crm/automations')}
              className="h-10 w-10 rounded-xl bg-gray-50 hover:bg-[#00F0FF]/10 border border-gray-200 hover:border-[#00F0FF]/30 flex flex-shrink-0 items-center justify-center transition-all hidden sm:flex cursor-pointer group"
              title={t('nav.automations', 'Centro de Automatizaciones & Triggers')}
            >
              <Zap className="w-5 h-5 text-gray-500 group-hover:text-[#00F0FF] transition-colors" />
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
      <HelpDrawer />
    </div>
  );
}
