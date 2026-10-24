import { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Search, 
  HelpCircle, 
  Tag, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  Layers, 
  PhoneCall, 
  ShieldCheck, 
  Zap, 
  Users, 
  Calendar 
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'contacts' | 'templates' | 'calls' | 'pipeline' | 'automations' | 'security' | 'general';
  question: {
    es: string;
    en: string;
    pt: string;
  };
  answer: {
    es: string;
    en: string;
    pt: string;
  };
  tags: string[];
}

export const FAQ_DATABASE: FAQItem[] = [
  {
    id: 'faq_contacts_import',
    category: 'contacts',
    tags: ['importar', 'excel', 'csv', 'duplicados', 'rutas'],
    question: {
      es: '¿Cómo importar listas masivas desde Excel o CSV sin crear duplicados?',
      en: 'How to import bulk lists from Excel or CSV without creating duplicates?',
      pt: 'Como importar listas em massa do Excel ou CSV sem criar duplicados?'
    },
    answer: {
      es: 'Dirígete a Listas y Contactos > Importar. Selecciona tu archivo .xlsx o .csv. El sistema normaliza automáticamente los números de teléfono (limpiando espacios, guiones y signos) y consulta en tiempo real Firestore para detectar coincidencias previas tanto en la base global como en el proyecto actual. Antes de importar, verás una previsualización interactiva donde puedes elegir omitir los registros repetidos o actualizar los datos existentes.',
      en: 'Go to Contact Lists > Import. Select your .xlsx or .csv file. The system automatically normalizes phone numbers and checks Firestore in real time to detect existing duplicates in both the global base and current project. Before importing, an interactive preview lets you choose whether to skip duplicates or update existing records.',
      pt: 'Vá para Listas e Contatos > Importar. Selecione o arquivo .xlsx ou .csv. O sistema normaliza automaticamente os números de telefone e verifica o Firestore em tempo real para detectar duplicados. Antes de importar, uma pré-visualização interativa permite ignorar registros repetidos ou atualizar dados existentes.'
    }
  },
  {
    id: 'faq_contacts_routes',
    category: 'contacts',
    tags: ['rutas', 'zonas', 'distribuidor', 'geografia'],
    question: {
      es: '¿Cómo asignar rutas y distribuidores a los contactos?',
      en: 'How to assign routes and distributors to contacts?',
      pt: 'Como atribuir rotas e distribuidores aos contatos?'
    },
    answer: {
      es: 'Al crear un proyecto o importar una lista, puedes asociar una "Ruta" (ej: Ruta Norte, Cuadrante Centro) y un "Distribuidor". Si el archivo Excel contiene una columna de ruta o código postal, el importador la mapea directamente. De lo contrario, puedes seleccionar una ruta por defecto que se aplicará automáticamente a todos los contactos del lote.',
      en: 'When creating a project or importing a list, you can assign a "Route" (e.g. North Route, Center District) and a "Distributor". If the Excel file contains a route column or postal code, the importer maps it directly. Otherwise, you can pick a default route applied to all contacts in the batch.',
      pt: 'Ao criar um projeto ou importar uma lista, você pode vincular uma "Rota" e um "Distribuidor". Se o arquivo Excel contiver uma coluna de rota ou CEP, o importador fará o mapeamento direto. Caso contrário, escolha uma rota padrão aplicada ao lote.'
    }
  },
  {
    id: 'faq_templates_bitrix',
    category: 'templates',
    tags: ['plantillas', 'fichas', 'bitrix', 'campos personalizados'],
    question: {
      es: '¿Cómo funciona el creador de fichas configurables tipo Bitrix24?',
      en: 'How does the Bitrix24-style configurable template builder work?',
      pt: 'Como funciona o criador de fichas configuráveis estilo Bitrix24?'
    },
    answer: {
      es: 'En "Plantillas de Ficha", los administradores pueden crear esquemas dinámicos para cada tipo de operación (Cita Distribuidor, Prospección TLMK, etc.). Los campos base como Nombre, Teléfono y Proyecto están protegidos por el sistema, mientras que los campos personalizados (enlace GPS, cupón de descuento, regalo ofrecido, productos de interés) se pueden agregar, ordenar y configurar con validaciones obligatorias.',
      en: 'In "Form Templates", administrators can create dynamic schemas for each operation type (Distributor Appointment, TLMK Cold Calling, etc.). System fields like Name, Phone, and Project are protected, while custom fields (GPS link, discount coupon, free gift, products of interest) can be added, ordered, and marked as required.',
      pt: 'Em "Modelos de Ficha", os administradores podem criar esquemas dinâmicos para cada operação. Campos padrão como Nome, Telefone e Projeto são protegidos, enquanto campos personalizados (link GPS, cupom, presente, produtos de interesse) podem ser adicionados e configurados como obrigatórios.'
    }
  },
  {
    id: 'faq_templates_card_export',
    category: 'templates',
    tags: ['exportar', 'kanban', 'tarjeta', 'whatsapp', 'distribuidor'],
    question: {
      es: '¿Cómo se genera la tarjeta entregable para el distribuidor?',
      en: 'How is the deliverable card for the distributor generated?',
      pt: 'Como o cartão entregável para o distribuidor é gerado?'
    },
    answer: {
      es: 'Cada campo personalizado cuenta con la opción "Incluir en Tarjeta Entregable" y un selector de emoji (📍, 🔗, 👤, 📅, 👉, 🎁, 📲, 📝). Cuando se confirma una cita, el sistema genera automáticamente un formato limpio listo para copiar y pegar en WhatsApp o descargar en PDF, incluyendo la ubicación GPS, datos de atención y oferta acordada.',
      en: 'Each custom field has an "Include in Deliverable Card" option and an emoji selector (📍, 🔗, 👤, 📅, 👉, 🎁, 📲, 📝). When an appointment is scheduled, the system generates a clean formatted card ready to copy to WhatsApp or download as PDF with GPS coordinates and appointment details.',
      pt: 'Cada campo personalizado tem a opção "Incluir no Cartão Entregável" e um seletor de emoji. Quando a reunião é agendada, o sistema gera um cartão formatado pronto para copiar no WhatsApp ou baixar em PDF, contendo coordenadas GPS e detalhes do atendimento.'
    }
  },
  {
    id: 'faq_calls_zadarma',
    category: 'calls',
    tags: ['voip', 'zadarma', 'softphone', 'audio', 'webrtc'],
    question: {
      es: '¿Qué hacer si el softphone VoIP no emite audio o falla la conexión?',
      en: 'What to do if the VoIP softphone has no audio or connection fails?',
      pt: 'O que fazer se o softphone VoIP não emitir áudio ou a conexão falhar?'
    },
    answer: {
      es: '1. Verifica que hayas concedido permisos de micrófono en tu navegador.\n2. En la consola VoIP, comprueba que el estado del proveedor figure en verde "Conectado".\n3. Si usas Zadarma o SIP personalizado, revisa que la extensión SIP y el secreto no hayan expirado.\n4. Cada llamada registra automáticamente la disposición (Interesado, No Contesta, Buzón) y se vincula a la ficha del contacto.',
      en: '1. Ensure microphone permissions are granted in your browser.\n2. In the VoIP console, verify that the provider status is green "Connected".\n3. If using Zadarma or custom SIP, check that SIP extension and secret are active.\n4. Every call automatically logs disposition (Interested, No Answer, Voicemail) to the contact card.',
      pt: '1. Verifique as permissões de microfone no navegador.\n2. Na central VoIP, confirme se o status do provedor está verde "Conectado".\n3. Se usar Zadarma ou SIP personalizado, confira se o ramal SIP está ativo.\n4. Cada ligação salva automaticamente o resultado na ficha do contato.'
    }
  },
  {
    id: 'faq_pipeline_appointments',
    category: 'pipeline',
    tags: ['pipeline', 'citas', 'gps', 'kanban', 'estados'],
    question: {
      es: '¿Cómo funciona la verificación GPS de las citas comerciales?',
      en: 'How does GPS verification for commercial appointments work?',
      pt: 'Como funciona a verificação GPS das reuniões comerciais?'
    },
    answer: {
      es: 'Cuando un asesor o distribuidor asiste físicamente a una cita, el sistema permite realizar Check-In móvil mediante geolocalización del navegador. Si la distancia al punto acordado es menor al radio configurado, el estado de la cita se actualiza a "CITA_CUMPLIDA (GPS Verificada)", protegiendo las comisiones y garantizando la visita real.',
      en: 'When an agent or distributor attends an appointment in person, mobile check-in captures browser geolocation. If the distance to the scheduled address is within the threshold, the appointment updates to "CITA_CUMPLIDA (GPS Verified)", securing commissions and confirming attendance.',
      pt: 'Quando o consultor ou distribuidor comparece presencialmente, o check-in móvel usa a geolocalização do navegador. Se estiver dentro do raio estipulado, o status muda para "CITA_CUMPLIDA (GPS Verificada)", validando comissões.'
    }
  },
  {
    id: 'faq_automations_engine',
    category: 'automations',
    tags: ['automatizacion', 'reglas', 'cuando', 'si', 'hacer', 'dry run'],
    question: {
      es: '¿Cómo crear reglas con el motor "Cuando / Si / Hacer" y probarlas con Dry-Run?',
      en: 'How to create rules with the "When / If / Then" engine and test them via Dry-Run?',
      pt: 'Como criar regras no motor "Quando / Se / Fazer" e testá-las com Dry-Run?'
    },
    answer: {
      es: 'En el módulo de Automatizaciones, crea una regla seleccionando el disparador (ej: "Cuando el estado del lead cambie a Cita Agendada"), las condiciones lógicas (ej: "Si el distribuidor es X y el valor > 500") y las acciones resultantes (enviar notificación, crear tarea, registrar log). Puedes presionar "Simulación en Modo Seco (Dry-Run)" para probar la regla con un registro simulado sin alterar la base de datos real.',
      en: 'In Automations, create a rule by selecting the trigger (e.g. "When lead status changes to Appointment"), conditions (e.g. "If distributor is X and value > 500"), and actions (send notification, create task, write log). Click "Dry-Run Simulation" to test against mock data without modifying real records.',
      pt: 'No módulo de Automações, crie uma regra escolhendo o gatilho, as condições e as ações. Use o botão "Simulação em Modo Seco (Dry-Run)" para testar a lógica sem alterar registros reais no banco de dados.'
    }
  },
  {
    id: 'faq_security_audit',
    category: 'security',
    tags: ['seguridad', 'auditoria', 'sesiones', 'mfa', 'suspender'],
    question: {
      es: '¿Cómo cerrar sesiones remotas o auditar acciones de los usuarios?',
      en: 'How to terminate remote sessions or audit user actions?',
      pt: 'Como encerrar sessões remotas ou auditar ações de usuários?'
    },
    answer: {
      es: 'El Centro de Seguridad muestra en tiempo real todas las sesiones activas con dirección IP, navegador y hora de inicio. Un administrador puede suspender cuentas o revocar sesiones de inmediato con un clic. Además, la pestaña "Registro de Auditoría Forense" guarda de manera inmutable cada cambio de rol, borrado o modificación de plantillas.',
      en: 'The Security Center shows all active user sessions with IP address, browser, and start time in real time. Administrators can suspend accounts or terminate sessions immediately. The "Forensic Audit Log" tab keeps an immutable record of role changes, deletions, and template updates.',
      pt: 'A Central de Segurança exibe em tempo real sessões ativas com IP, navegador e horário. Administradores podem suspender contas ou revogar acessos. A aba "Auditoria Forense" registra alterações de papéis e exclusões.'
    }
  }
];

interface FAQAccordionProps {
  defaultCategory?: 'all' | FAQItem['category'];
  compact?: boolean;
}

export default function FAQAccordion({ defaultCategory = 'all', compact = false }: FAQAccordionProps) {
  const { language } = useLanguage();
  const currentLang = (['es', 'en', 'pt'].includes(language) ? language : 'es') as 'es' | 'en' | 'pt';

  const [activeCategory, setActiveCategory] = useState<'all' | FAQItem['category']>(defaultCategory);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const categories = [
    { id: 'all', label: { es: 'Todos', en: 'All', pt: 'Todos' }, icon: HelpCircle },
    { id: 'contacts', label: { es: 'Contactos & Rutas', en: 'Contacts & Routes', pt: 'Contatos & Rotas' }, icon: Users },
    { id: 'templates', label: { es: 'Fichas & Plantillas', en: 'Templates & Cards', pt: 'Modelos & Cartões' }, icon: Layers },
    { id: 'calls', label: { es: 'Telefonía VoIP', en: 'VoIP Softphone', pt: 'Telefonia VoIP' }, icon: PhoneCall },
    { id: 'pipeline', label: { es: 'Pipeline & Citas', en: 'Pipeline & Appointments', pt: 'Pipeline & Reuniões' }, icon: Calendar },
    { id: 'automations', label: { es: 'Automatizaciones', en: 'Automations', pt: 'Automações' }, icon: Zap },
    { id: 'security', label: { es: 'Seguridad & Auditoría', en: 'Security & Audit', pt: 'Segurança & Auditoria' }, icon: ShieldCheck },
  ];

  const filteredItems = useMemo(() => {
    return FAQ_DATABASE.filter((item) => {
      const matchesCat = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCat) return false;

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const questionText = item.question[currentLang].toLowerCase();
      const answerText = item.answer[currentLang].toLowerCase();
      const tagMatch = item.tags.some((t) => t.toLowerCase().includes(q));

      return questionText.includes(q) || answerText.includes(q) || tagMatch;
    });
  }, [activeCategory, searchTerm, currentLang]);

  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
  };

  return (
    <div className="space-y-4">
      {/* Buscador de preguntas */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={
            currentLang === 'es'
              ? 'Buscar preguntas por palabra clave o función...'
              : currentLang === 'en'
              ? 'Search questions by keyword or feature...'
              : 'Pesquisar perguntas por palavra-chave ou recurso...'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00F0FF] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Selector de categorías si no está en modo ultra compacto */}
      {!compact && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label[currentLang]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de Acordeones */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-bold">
              {currentLang === 'es'
                ? 'No se encontraron preguntas que coincidan con tu búsqueda.'
                : currentLang === 'en'
                ? 'No questions matched your search.'
                : 'Nenhuma pergunta correspondeu à sua pesquisa.'}
            </p>
            <p className="text-[11px] text-slate-500">
              {currentLang === 'es'
                ? 'Intenta con otros términos o abre el Chat de Soporte IA para asistencia inmediata.'
                : currentLang === 'en'
                ? 'Try different terms or open AI Support Chat for immediate help.'
                : 'Tente outros termos ou abra o Chat de Suporte IA para assistência imediata.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const answerText = item.answer[currentLang];
            const hasUp = feedback[item.id] === 'up';
            const hasDown = feedback[item.id] === 'down';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-900/90 border-[#00F0FF]/40 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Pregunta Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-3.5 text-left flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-950/60 border border-cyan-800/40 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      ?
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {item.question[currentLang]}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-black/40 border border-slate-900"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 mt-1 ${
                      isExpanded ? 'rotate-180 text-[#00F0FF]' : ''
                    }`}
                  />
                </button>

                {/* Respuesta Colapsable */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-800/80 bg-slate-950/50"
                    >
                      <div className="p-4 space-y-3 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        <p>{answerText}</p>

                        {/* Barra de utilidades: copiar y feedback */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[11px] text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleCopyAnswer(item.id, answerText)}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-[#00F0FF] transition-colors cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar respuesta</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px]">¿Fue útil?</span>
                            <button
                              type="button"
                              onClick={() => handleFeedback(item.id, 'up')}
                              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                hasUp
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'border-slate-800 hover:text-white'
                              }`}
                              title="Sí, fue útil"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(item.id, 'down')}
                              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                hasDown
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                  : 'border-slate-800 hover:text-white'
                              }`}
                              title="No respondió mi duda"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
