import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import FAQAccordion, { FAQItem } from './FAQAccordion';
import SupportTab from './SupportTab';
import { 
  HelpCircle, 
  X, 
  BookOpen, 
  Sparkles, 
  MessageSquare, 
  Compass, 
  CheckCircle2, 
  Layers, 
  PhoneCall, 
  ShieldCheck, 
  Zap, 
  Users, 
  Calendar, 
  ExternalLink, 
  Lightbulb, 
  ChevronRight, 
  Bot,
  Headphones
} from 'lucide-react';

interface ModuleSOP {
  title: { es: string; en: string; pt: string };
  badge: string;
  category: FAQItem['category'];
  description: { es: string; en: string; pt: string };
  steps: {
    num: string;
    title: { es: string; en: string; pt: string };
    desc: { es: string; en: string; pt: string };
  }[];
  criticalRules: { es: string; en: string; pt: string }[];
}

const MODULE_SOPS: Record<string, ModuleSOP> = {
  'form-templates': {
    title: {
      es: 'Manual Operativo: Plantillas de Ficha',
      en: 'Standard Operating Procedure: Form Templates',
      pt: 'Procedimento Operacional: Modelos de Ficha'
    },
    badge: 'MÓDULO 6',
    category: 'templates',
    description: {
      es: 'Configura esquemas dinámicos tipo Bitrix24 para visitas en terreno y citas entregables a distribuidores.',
      en: 'Configure dynamic Bitrix24-style schemas for field visits and deliverable cards to distributors.',
      pt: 'Configure esquemas dinâmicos estilo Bitrix24 para visitas a campo e fichas para distribuidores.'
    },
    steps: [
      {
        num: '01',
        title: { es: 'Crear o clonar plantilla', en: 'Create or clone template', pt: 'Criar ou clonar modelo' },
        desc: {
          es: 'Elige una plantilla predeterminada o crea una nueva definiendo el tipo de operación comercial.',
          en: 'Pick a default template or create a new one specifying the business operation type.',
          pt: 'Escolha um modelo padrão ou crie um novo definindo o tipo de operação comercial.'
        }
      },
      {
        num: '02',
        title: { es: 'Añadir campos personalizados', en: 'Add custom fields', pt: 'Adicionar campos personalizados' },
        desc: {
          es: 'Selecciona tipos de datos (GPS, Select, Cupón, Fecha) y agrúpalos en secciones lógicas.',
          en: 'Select data types (GPS, Dropdown, Coupon, Date) and group them into logical sections.',
          pt: 'Selecione tipos de dados (GPS, Select, Cupom, Data) e agrupe-os em seções lógicas.'
        }
      },
      {
        num: '03',
        title: { es: 'Activar exportación de tarjeta', en: 'Enable card export', pt: 'Ativar exportação de cartão' },
        desc: {
          es: 'Marca los campos que deben incluirse en el formato WhatsApp/PDF del distribuidor y asígnales un emoji.',
          en: 'Check fields to be included in distributor WhatsApp/PDF cards and assign emoji markers.',
          pt: 'Marque os campos que devem ser incluídos no formato WhatsApp/PDF e defina o emoji.'
        }
      },
      {
        num: '04',
        title: { es: 'Guardar y heredar en contactos', en: 'Save and inherit to contacts', pt: 'Salvar e herdar nos contatos' },
        desc: {
          es: 'Al guardar, la plantilla se versiona en Firestore y se registra en audit_logs automáticamente.',
          en: 'Upon saving, the template is versioned in Firestore and logged in audit_logs automatically.',
          pt: 'Ao salvar, o modelo é versionado no Firestore e registrado em audit_logs automaticamente.'
        }
      }
    ],
    criticalRules: [
      {
        es: 'Los campos fijos del sistema (Nombre, Teléfono, Proyecto, Ruta, Responsable) son inmutables para garantizar consistencia.',
        en: 'System fixed fields (Name, Phone, Project, Route, Agent) cannot be deleted to ensure CRM consistency.',
        pt: 'Campos padrão do sistema não podem ser excluídos para manter a integridade do CRM.'
      },
      {
        es: 'Solo los roles SuperAdmin, Admin y Gestor tienen permisos para publicar cambios en plantillas.',
        en: 'Only SuperAdmin, Admin, and Gestor roles can publish changes to templates.',
        pt: 'Apenas SuperAdmin, Admin e Gestor podem publicar alterações em modelos.'
      }
    ]
  },
  'calls': {
    title: {
      es: 'Manual Operativo: Telefonía VoIP & Discador',
      en: 'Standard Operating Procedure: VoIP Softphone',
      pt: 'Procedimento Operacional: Telefonia VoIP'
    },
    badge: 'TELEMARKETING',
    category: 'calls',
    description: {
      es: 'Emisión de llamadas en 1-clic con registro automático de disposiciones y notas de voz.',
      en: '1-click calling with automatic disposition logging and call notes.',
      pt: 'Ligações em 1 clique com registro automático de resultados e anotações.'
    },
    steps: [
      {
        num: '01',
        title: { es: 'Verificar estado del softphone', en: 'Verify softphone status', pt: 'Verificar status do softphone' },
        desc: {
          es: 'Comprueba el indicador verde "Conectado" en la cabecera antes de iniciar tu tanda de marcación.',
          en: 'Check the green "Connected" indicator in the header before starting your dialing batch.',
          pt: 'Confira o indicador verde "Conectado" antes de iniciar sua sessão de ligações.'
        }
      },
      {
        num: '02',
        title: { es: 'Marcar contacto o cargar lista', en: 'Dial contact or load list', pt: 'Discar contato ou carregar lista' },
        desc: {
          es: 'Haz clic en el icono de teléfono de cualquier ficha o introduce el número en el teclado virtual.',
          en: 'Click the phone icon on any contact card or enter the number on the dial pad.',
          pt: 'Clique no ícone de telefone em qualquer ficha ou digite no teclado virtual.'
        }
      },
      {
        num: '03',
        title: { es: 'Registrar resultado obligatorio', en: 'Record mandatory disposition', pt: 'Registrar resultado obrigatório' },
        desc: {
          es: 'Al colgar, selecciona la disposición (Interesado, Cita Agendada, No Contesta, Buzón).',
          en: 'When hanging up, pick the call outcome (Interested, Scheduled Appointment, No Answer).',
          pt: 'Ao desligar, selecione o resultado (Interessado, Reunião Agendada, Caixa Postal).'
        }
      }
    ],
    criticalRules: [
      {
        es: 'No abandonar la llamada sin tipificar el resultado para no descalibrar las métricas de conversión.',
        en: 'Never close a call without selecting a disposition to maintain accurate conversion metrics.',
        pt: 'Nunca finalize a chamada sem classificar o resultado.'
      }
    ]
  },
  'pipeline': {
    title: {
      es: 'Manual Operativo: Pipeline de Ventas & Citas',
      en: 'Standard Operating Procedure: Sales Pipeline',
      pt: 'Procedimento Operacional: Pipeline de Vendas'
    },
    badge: 'KANBAN COMERCIAL',
    category: 'pipeline',
    description: {
      es: 'Flujo visual de leads desde Meta Ads hasta el Cierre o Cita Cumplida verificada por GPS.',
      en: 'Visual flow of leads from Meta Ads to Closed Deals or GPS-verified appointments.',
      pt: 'Fluxo visual de leads desde Meta Ads até o fechamento ou reunião verificada por GPS.'
    },
    steps: [
      {
        num: '01',
        title: { es: 'Arrastrar oportunidad por etapas', en: 'Drag opportunity across stages', pt: 'Arrastar oportunidade nas etapas' },
        desc: {
          es: 'Mueve las tarjetas entre Lead In, Contactado, Seguimiento, Cita Agendada y Ganado.',
          en: 'Move cards between Lead In, Contacted, Follow-up, Appointment Scheduled, and Won.',
          pt: 'Mova os cartões entre Novo Lead, Contatado, Seguimento e Ganho.'
        }
      },
      {
        num: '02',
        title: { es: 'Agendar cita con georreferencia', en: 'Schedule georeferenced appointment', pt: 'Agendar reunião com GPS' },
        desc: {
          es: 'Define fecha, hora, distribuidor asignado y enlace GPS de la ubicación.',
          en: 'Set date, time, assigned distributor, and Google Maps GPS location link.',
          pt: 'Defina dia, hora, distribuidor responsável e link do Google Maps.'
        }
      }
    ],
    criticalRules: [
      {
        es: 'Las citas que no cuenten con Check-in GPS quedarán en estado pendiente de auditoría.',
        en: 'Appointments without GPS check-in will remain pending audit review.',
        pt: 'Reuniões sem check-in GPS permanecerão pendentes de auditoria.'
      }
    ]
  },
  'automations': {
    title: {
      es: 'Manual Operativo: Motor de Automatización',
      en: 'Standard Operating Procedure: Automation Engine',
      pt: 'Procedimento Operacional: Motor de Automação'
    },
    badge: 'MÓDULO 2',
    category: 'automations',
    description: {
      es: 'Diseña flujos lógicos automáticos con el paradigma "Cuando / Si / Hacer" y ejecuciones seguras en modo Dry-Run.',
      en: 'Design automated logical workflows with "When / If / Then" rules and safe Dry-Run simulations.',
      pt: 'Crie automações no modelo "Quando / Se / Fazer" e faça testes com simulação Dry-Run.'
    },
    steps: [
      {
        num: '01',
        title: { es: 'Definir el Disparador (Cuando)', en: 'Define the Trigger (When)', pt: 'Definir o Gatilho (Quando)' },
        desc: {
          es: 'Especifica qué evento activa la regla (Cambio de etapa, Cita cumplida, Nuevo lead).',
          en: 'Specify what event activates the rule (Stage change, Appointment held, New lead).',
          pt: 'Especifique o evento que ativa a regra (Mudança de etapa, Novo lead).'
        }
      },
      {
        num: '02',
        title: { es: 'Configurar Condiciones (Si)', en: 'Set Conditions (If)', pt: 'Configurar Condições (Se)' },
        desc: {
          es: 'Añade filtros por distribuidor, valor de contrato o etiqueta.',
          en: 'Add filters by distributor, contract value, or tag.',
          pt: 'Adicione filtros por distribuidor, valor ou tag.'
        }
      },
      {
        num: '03',
        title: { es: 'Ejecutar Acciones (Hacer)', en: 'Execute Actions (Then)', pt: 'Executar Ações (Fazer)' },
        desc: {
          es: 'Genera tareas, notificaciones o webhooks de integración.',
          en: 'Create tasks, push notifications, or call external integration webhooks.',
          pt: 'Gere tarefas, notificações ou chame integrações externas.'
        }
      }
    ],
    criticalRules: [
      {
        es: 'Prueba siempre tus reglas con el botón "Dry-Run" antes de activarlas para producción.',
        en: 'Always test rules using "Dry-Run" button before enabling them in production.',
        pt: 'Sempre teste suas regras com o botão "Dry-Run" antes de ativá-las.'
      }
    ]
  },
  'security': {
    title: {
      es: 'Manual Operativo: Seguridad & Auditoría',
      en: 'Standard Operating Procedure: Security & Audit',
      pt: 'Procedimento Operacional: Segurança & Auditoria'
    },
    badge: 'MÓDULO 3',
    category: 'security',
    description: {
      es: 'Monitoreo de sesiones en vivo, configuración de MFA y auditoría forense inmutable.',
      en: 'Live session monitoring, MFA enforcement, and immutable forensic audit logs.',
      pt: 'Monitoramento de sessões em tempo real, MFA e registros forenses.'
    },
    steps: [
      {
        num: '01',
        title: { es: 'Supervisar accesos activos', en: 'Monitor active sessions', pt: 'Supervisionar acessos ativos' },
        desc: {
          es: 'Visualiza la lista de colaboradores conectados con dirección IP y dispositivo.',
          en: 'Inspect connected operators with IP addresses and device information.',
          pt: 'Verifique os operadores conectados com IP e dispositivo.'
        }
      },
      {
        num: '02',
        title: { es: 'Suspender cuentas o cerrar sesiones', en: 'Suspend accounts or revoke sessions', pt: 'Suspender contas ou revogar sessões' },
        desc: {
          es: 'Desconecta de forma remota cualquier sesión sospechosa con confirmación de dos pasos.',
          en: 'Remotely disconnect any suspicious session with 2-step confirmation.',
          pt: 'Desconecte remotamente qualquer sessão suspeita.'
        }
      }
    ],
    criticalRules: [
      {
        es: 'Cada intervención queda grabada de forma indeleble en la colección audit_logs de Firestore.',
        en: 'Every security action is immutably recorded in Firestore audit_logs collection.',
        pt: 'Cada intervenção é gravada de forma indelével no audit_logs.'
      }
    ]
  },
  'integrations': {
    title: {
      es: 'Manual Operativo: Integraciones Externas',
      en: 'Standard Operating Procedure: External Integrations',
      pt: 'Procedimento Operacional: Integrações Externas'
    },
    badge: 'MÓDULO 9',
    category: 'general',
    description: {
      es: 'Sincronización omnicanal en tiempo real con Meta Lead Ads, WhatsApp Cloud, Instagram, formularios web y ERPs.',
      en: 'Real-time omnichannel synchronization with Meta Lead Ads, WhatsApp Cloud, Instagram, web forms, and ERPs.',
      pt: 'Sincronização multicanal em tempo real com Meta Lead Ads, WhatsApp Cloud, formulários web e ERPs.'
    },
    steps: [
      {
        num: '01',
        title: { es: 'Seleccionar proveedor y verificar credenciales', en: 'Select provider and verify credentials', pt: 'Selecionar provedor e conferir credenciais' },
        desc: {
          es: 'Localiza el canal a conectar (Meta, WhatsApp, SMTP, etc.) y ten a mano los tokens o IDs requeridos.',
          en: 'Locate the channel to connect (Meta, WhatsApp, SMTP, etc.) and gather required tokens or IDs.',
          pt: 'Localize o canal a conectar e reúna os tokens ou IDs necessários.'
        }
      },
      {
        num: '02',
        title: { es: 'Ejecutar prueba de conexión real', en: 'Run real connection test', pt: 'Executar teste de conexão real' },
        desc: {
          es: 'Presiona "Probar" en la tarjeta. El sistema efectuará un ping de diagnóstico y validará la latencia.',
          en: 'Click "Test" on the card. The system will perform a diagnostic ping and measure latency.',
          pt: 'Clique em "Testar". O sistema fará um ping diagnóstico e medirá a latência.'
        }
      },
      {
        num: '03',
        title: { es: 'Verificar vinculación con automatizaciones', en: 'Verify automation triggers linkage', pt: 'Verificar conexão com automações' },
        desc: {
          es: 'Los eventos recibidos alimentarán automáticamente el Motor de Automatizaciones para asignación y alertas.',
          en: 'Incoming events will automatically feed the Automations Engine for assignment and alerts.',
          pt: 'Eventos recebidos alimentarão automaticamente o motor de regras.'
        }
      }
    ],
    criticalRules: [
      {
        es: 'Solo los roles SuperAdmin, Admin y Gestor tienen permisos para modificar credenciales o desconectar canales.',
        en: 'Only SuperAdmin, Admin, and Gestor roles are authorized to modify credentials or disconnect channels.',
        pt: 'Apenas SuperAdmin, Admin e Gestor podem modificar credenciais ou desconectar canais.'
      },
      {
        es: 'Nunca compartas ni expongas los Access Tokens de Meta o firmas secretas de Webhook.',
        en: 'Never share or publicly expose Meta Access Tokens or webhook secret signatures.',
        pt: 'Nunca compartilhe Access Tokens do Meta ou assinaturas de webhooks.'
      }
    ]
  }
};

const DEFAULT_SOP: ModuleSOP = {
  title: {
    es: 'Centro de Ayuda & Guía del Ecosistema',
    en: 'Help Center & Ecosystem Guide',
    pt: 'Central de Ajuda & Guia do Ecossistema'
  },
  badge: 'KAIVINCIA CRM',
  category: 'general',
  description: {
    es: 'Plataforma integral de operaciones comerciales, prospección multicanal y auditoría en tiempo real.',
    en: 'Comprehensive platform for sales operations, multichannel outreach, and real-time auditing.',
    pt: 'Plataforma abrangente para operações de vendas e auditoria em tempo real.'
  },
  steps: [
    {
      num: '01',
      title: { es: 'Explorar tu panel operativo', en: 'Explore your operations dashboard', pt: 'Explorar painel operacional' },
      desc: {
        es: 'Encuentra tus tareas pendientes y atajos rápidos según el rol asignado a tu cuenta.',
        en: 'Find pending tasks and quick shortcuts tailored to your account role.',
        pt: 'Veja suas tarefas pendentes e atalhos de acordo com seu papel.'
      }
    },
    {
      num: '02',
      title: { es: 'Usar la barra de comandos', en: 'Use command bar', pt: 'Usar a barra de comando' },
      desc: {
        es: 'Presiona Ctrl+K o Cmd+K para saltar a cualquier módulo, cliente o contacto al instante.',
        en: 'Press Ctrl+K or Cmd+K to jump to any module, client, or record instantly.',
        pt: 'Pressione Ctrl+K ou Cmd+K para navegar rapidamente.'
      }
    }
  ],
  criticalRules: [
    {
      es: 'Mantén siempre actualizado el estado de tus citas y llamadas asignadas.',
      en: 'Keep your assigned calls and appointments updated in real time.',
      pt: 'Mantenha atualizado o status de suas reuniões e chamadas.'
    }
  ]
};

export default function HelpDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sop' | 'faq' | 'support'>('sop');
  const [activeTicketCount, setActiveTicketCount] = useState<number>(0);
  const location = useLocation();
  const { language, t } = useLanguage();
  const currentLang = (['es', 'en', 'pt'].includes(language) ? language : 'es') as 'es' | 'en' | 'pt';

  // Detectar módulo según la ruta actual
  const currentModuleKey = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('form-templates')) return 'form-templates';
    if (path.includes('calls')) return 'calls';
    if (path.includes('pipeline')) return 'pipeline';
    if (path.includes('automations')) return 'automations';
    if (path.includes('security')) return 'security';
    if (path.includes('integrations')) return 'integrations';
    return 'default';
  }, [location.pathname]);

  const currentSOP = MODULE_SOPS[currentModuleKey] || DEFAULT_SOP;

  // Atajo de teclado: F1 o Ctrl+Shift+H para abrir la ayuda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Botón Flotante Global de Ayuda y Manuales (?) */}
      <div className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2">
        <motion.button
          type="button"
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B0E14] to-slate-900 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:border-[#00F0FF] transition-all group cursor-pointer"
          title="Manuales & Centro de Ayuda Global (F1)"
        >
          <HelpCircle className="w-6 h-6 transition-transform group-hover:rotate-12" />
          {/* Pulso de actividad */}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00F0FF] animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00F0FF]" />
        </motion.button>
      </div>

      {/* Drawer Deslizable */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm transition-opacity"
            />

            {/* Contenedor del Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[10000] w-full max-w-xl bg-[#070A0F] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100"
            >
              {/* Cabecera del Drawer */}
              <div className="p-5 border-b border-slate-800 bg-[#0B0E14] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-[#00F0FF] border border-[#00F0FF]/30 font-bold uppercase">
                        {currentSOP.badge}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">SOP & FAQ</span>
                    </div>
                    <h2 className="text-sm font-black text-white uppercase italic tracking-wide">
                      {currentSOP.title[currentLang]}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de Pestañas del Drawer */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('sop')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'sop'
                      ? 'border-[#00F0FF] text-[#00F0FF]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Manual Paso a Paso</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'faq'
                      ? 'border-[#00F0FF] text-[#00F0FF]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FAQ Contextual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('support')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === 'support'
                      ? 'border-[#00F0FF] text-[#00F0FF]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{t('helpdesk.tab_support', 'Soporte')}</span>
                  {activeTicketCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {activeTicketCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Contenido con Scroll */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* PESTAÑA 1: Manual SOP */}
                {activeTab === 'sop' && (
                  <div className="space-y-6">
                    {/* Tarjeta de descripción */}
                    <div className="p-4 rounded-2xl bg-blue-950/20 border border-cyan-900/40 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                        <Compass className="w-4 h-4" />
                        <span>Propósito Operativo</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentSOP.description[currentLang]}
                      </p>
                    </div>

                    {/* Pasos ordenados */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
                        Flujo de Ejecución Estándar
                      </h3>
                      <div className="space-y-2.5">
                        {currentSOP.steps.map((st) => (
                          <div
                            key={st.num}
                            className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-start gap-3"
                          >
                            <span className="w-7 h-7 rounded-xl bg-cyan-950/70 text-[#00F0FF] border border-cyan-800/40 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {st.num}
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-white">
                                {st.title[currentLang]}
                              </h4>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {st.desc[currentLang]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reglas Críticas */}
                    {currentSOP.criticalRules && currentSOP.criticalRules.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>Reglas y Políticas Críticas</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-amber-200/90 list-disc list-inside">
                          {currentSOP.criticalRules.map((rule, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {rule[currentLang]}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* PESTAÑA 2: FAQ Contextual */}
                {activeTab === 'faq' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-mono text-slate-400 uppercase">
                        Preguntas frecuentes para {currentSOP.badge}
                      </span>
                    </div>
                    <FAQAccordion defaultCategory={currentSOP.category} />
                  </div>
                )}

                {/* PESTAÑA 3: Soporte y Mesa de Ayuda */}
                {activeTab === 'support' && (
                  <SupportTab
                    onCloseDrawer={() => setIsOpen(false)}
                    onTicketCountChange={setActiveTicketCount}
                  />
                )}
              </div>

              {/* Pie del Drawer */}
              <div className="p-4 border-t border-slate-800 bg-[#0B0E14] flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-[10px]">Atajo rápido: F1 / Esc para cerrar</span>
                <span className="text-[#00F0FF] font-mono text-[10px]">Kaivincia Global SOP v2.5</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
