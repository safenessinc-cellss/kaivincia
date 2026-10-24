import React, { useState } from 'react';
import { 
  BookOpen, Target, CheckCircle2, AlertCircle, MapPin, 
  Smartphone, Calendar, ChevronRight, Zap, ShieldCheck,
  CheckSquare, ArrowRight, XCircle, Phone, Database, Layers,
  Globe, FileAudio, FileText, Server, Users2, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SOPSection {
  type: 'callout' | 'flowchart' | 'steps' | 'script' | 'checklist' | 'dashboard-overview';
  title: string;
  subtitle?: string;
  items?: string[];
  steps?: { label: string; desc: string; type?: 'violet' | 'cyan' | 'emerald' | 'red' | 'normal' }[];
  text?: string;
  checklistItems?: { text: string; id: string }[];
}

interface SOPDocument {
  id: string;
  title: string;
  desc: string;
  image: string;
  sections: SOPSection[];
}

const DEPARTMENTS = [
  { id: 'KV-PRO-ADM', name: 'Administración & RRHH', color: 'text-violet-500' },
  { id: 'KV-PRO-VOIP', name: 'Voz & Telecomunicaciones', color: 'text-orange-500' },
  { id: 'KV-PRO-VTA', name: 'Ventas / Setters', color: 'text-cyan-500' },
  { id: 'KV-PRO-FIELD', name: 'Despliegue Táctico', color: 'text-emerald-500' },
];

const DOCUMENTS: Record<string, SOPDocument[]> = {
  'KV-PRO-ADM': [
    {
      id: 'KV-PRO-ADM-01',
      title: 'Manual General de la Plataforma CRM Kaivincia',
      desc: 'Guía oficial e interactiva para operar de punta a punta la plataforma de inteligencia comercial y CRM de Kaivincia Corp.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
      sections: [
        {
          type: 'callout',
          title: 'Arquitectura de Operación Unificada',
          items: [
            'Kaivincia CRM conecta de forma segura la Base de Datos de Clientes, el Pipeline Inteligente en tiempo real y la Consola VoIP de Zadarma.',
            'Cualquier cambio de estado en un Lead se propaga de inmediato a toda la plataforma mediante enlaces dinámicos en la base de datos de Firebase.',
            'El sistema cuenta con un Sistema Nervioso Central que audita y registra de forma automatizada cada interacción y evento operativo.'
          ]
        },
        {
          type: 'steps',
          title: 'Flujo de Trabajo del CRM de Kaivincia',
          steps: [
            { label: 'Carga de Leads Inteligente', desc: 'Sube registros manualmente en "Base de Clientes" o arrastra archivos CSV/TXT. El formateador inteligente impulsado por IA normalizará campos, autodetectará zonas horarias y preparará los datos.', type: 'cyan' },
            { label: 'Clasificación Automatizada', desc: 'La IA pre-clasifica el estado de salud del cliente en Activo, En Riesgo, Lead, o Inactivo basándose en la actividad reciente.', type: 'violet' },
            { label: 'Estrategia en Pipeline', desc: 'Usa el Pipeline de Ventas para arrastrar y soltar oportunidades (Kanban). El valor del contrato y el estado se actualizan de manera síncrona en la ficha del cliente.', type: 'emerald' },
            { label: 'Ejecución del Call-Center', desc: 'Llama con un clic desde el CRM usando la Consola de VoIP Zadarma, respetando los horarios seguros sugeridos por el sistema de zona horaria.', type: 'normal' }
          ]
        },
        {
          type: 'checklist',
          title: 'Checklist de Cumplimiento Operativo',
          checklistItems: [
            { id: 'c1', text: 'Validar duplicados en la Base de Clientes antes de cada importación.' },
            { id: 'c2', text: 'Asegurar que todas las llamadas realizadas cuenten con nota de seguimiento en el log de actividades.' },
            { id: 'c3', text: 'Actualizar las etapas del Pipeline diariamente para mantener la precisión del embudo y del panel de control.' },
            { id: 'c4', text: 'Revisar la consola del Sistema Nervioso para verificar eventos inusuales o fallos en Webhooks.' }
          ]
        }
      ]
    }
  ],
  'KV-PRO-VOIP': [
    {
      id: 'KV-PRO-VOIP-01',
      title: 'Manual del Operador VoIP & Zadarma Integration',
      desc: 'Instrucciones operativas para el uso del Click-to-Call, WebRTC y el sistema inteligente de protección de zonas horarias en Kaivincia.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      sections: [
        {
          type: 'callout',
          title: 'El Sistema Click-to-Call y la Zona Horaria de EE.UU.',
          items: [
            'Antes de iniciar cualquier llamada, el sistema valida el código de área del lead (por ejemplo, 213, 720, 631) para calcular su hora local actual.',
            'Regulación Estricta: Las llamadas telefónicas solo se permiten en el Horario Seguro (9:00 AM - 8:00 PM hora local del lead).',
            'Si intentas llamar fuera de esta ventana horaria, el CRM mostrará una advertencia crítica con la opción de cancelar, forzar continuación o agendar cita para horario recomendado.'
          ]
        },
        {
          type: 'flowchart',
          title: 'Protocolo de Validación de Zona Horaria (Zadarma API Gateway)',
          steps: [
            { label: 'Agente presiona "Llamar"', desc: 'Se intercepta el evento de llamada en el CRM.', type: 'normal' },
            { label: 'Extracción de Código de Área', desc: 'Se analizan los 3 primeros dígitos del número telefónico de EE.UU. (ej: California 213, New York 631).', type: 'cyan' },
            { label: 'Consulta de Zona Horaria', desc: 'Se busca en la base de datos de area_code_schedules si es zona PT, MT, CT o ET.', type: 'violet' },
            { label: 'Evaluación de Horario Seguro', desc: 'Si la hora actual local del lead está entre 9:00 AM y 8:00 PM, se autoriza la llamada directamente.', type: 'emerald' },
            { label: 'Bloqueo / Alerta de Horario', desc: 'Si es fuera de horario, se activa el escudo protector mostrando la advertencia dinámica en pantalla.', type: 'red' }
          ]
        },
        {
          type: 'script',
          title: 'Guion Sugerido para Apertura B2B',
          text: '"Hola [Nombre del Contacto], le saludo de Kaivincia Corp. Veo que tiene un requerimiento activo para la optimización de sus redes en su sede de [Ciudad]. Le llamo brevemente porque la tecnología de automatización nos indica que es un horario seguro para conversar en su zona de tiempo [Zona Horaria]. ¿Cuenta con 2 minutos para verificar los requerimientos técnicos?"'
        },
        {
          type: 'checklist',
          title: 'Checklist de Configuración de Audio & SIP',
          checklistItems: [
            { id: 'v1', text: 'Tener micrófono habilitado en el navegador con los permisos de iframe otorgados.' },
            { id: 'v2', text: 'Validar que la extensión SIP de Zadarma aparezca con estado "ONLINE / REGISTERED" en la consola del operador.' },
            { id: 'v3', text: 'Verificar la calidad de la señal de red en el indicador de latencia del Sistema Nervioso (óptimo < 100ms).' },
            { id: 'v4', text: 'Al colgar, cerciorarse de que el webhook de Zadarma haya subido automáticamente el audio grabado al call_log.' }
          ]
        }
      ]
    }
  ],
  'KV-PRO-VTA': [
    {
      id: 'KV-PRO-VTA-01',
      title: 'Prospección en LinkedIn',
      desc: 'Networking profesional de alto impacto y primer contacto en LinkedIn para adquisición de cuentas B2B.',
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80',
      sections: [
        {
          type: 'callout',
          title: 'Reglas de Oro en Prospección en LinkedIn',
          items: [
            'Nunca vendas en el primer mensaje. El objetivo es entablar una conversación honesta e identificar si tienen puntos de dolor de infraestructura.',
            'Optimiza tu perfil antes de conectar: Tu banner, foto y descripción de cargo deben posicionarte como un consultor técnico experto de Kaivincia Corp, no como un vendedor agresivo.',
            'Investiga al prospecto. Menciona un post reciente o logro de su empresa en tu nota de invitación para maximizar la tasa de aceptación.'
          ]
        },
        {
          type: 'steps',
          title: 'Etapas del Primer Contacto',
          steps: [
            { label: 'Identificación de Cuenta Target', desc: 'Busca empresas en sectores industriales o de TI ubicadas en California, Colorado, New York o New Jersey con más de 50 empleados.', type: 'normal' },
            { label: 'Mensaje de Conexión Personalizado', desc: 'Envía una invitación breve (menos de 300 caracteres) enfocándote en retos de optimización o conectividad de su zona geográfica.', type: 'cyan' },
            { label: 'Apertura de Conversación', desc: 'Una vez aceptada la conexión, agradece y lanza una pregunta de diagnóstico general sin presionar por una videollamada.', type: 'violet' }
          ]
        },
        {
          type: 'script',
          title: 'Plantilla de Invitación de Alto Rendimiento',
          text: '"Hola [Nombre], felicidades por el crecimiento reciente de [Empresa] en [Ciudad]. Veo que gestionas infraestructura técnica en la región. Me encantaría conectar para intercambiar mejores prácticas sobre despliegue táctico y conectividad de alta velocidad. Saludos!"'
        }
      ]
    },
    { 
      id: 'KV-PRO-VTA-02', 
      title: 'Agenda de Visitas', 
      desc: 'Protocolo oficial para el agendamiento y confirmación de visitas de consultores B2B a instalaciones del cliente. Diseño a prueba de errores.',
      image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80',
      sections: [
        {
          type: 'callout',
          title: 'La Regla del 3-3-3',
          items: [
            '03 Pasos Máximos para solicitar y confirmar una visita de campo.',
            '03 Segundos para que el cliente comprenda la propuesta de valor de la visita presencial.',
            '03 Checklists de Éxito requeridos para que la auditoría de despliegue sea autorizada.'
          ]
        },
        {
          type: 'flowchart',
          title: 'Flujograma de Decisión de Cita Presencial',
          steps: [
            { label: 'Lead Calificado > 80%', desc: 'Se verifica que la cuenta tenga presupuesto y necesidad reales en el CRM.', type: 'violet' },
            { label: '¿Decisor Principal Confirmó?', desc: 'Se valida que la llamada de confirmación haya sido con el CTO, Director de Operaciones o similar.', type: 'cyan' },
            { label: 'SÍ: Agendar en CRM', desc: 'Se registra el evento con ubicación GPS integrada, mapa y notas.', type: 'emerald' },
            { label: 'NO: Reprogramar Call', desc: 'Se regresa al lead a la etapa "Contactado" en el Pipeline de Ventas.', type: 'red' }
          ]
        },
        {
          type: 'script',
          title: 'Guion de Confirmación de Cita',
          text: '"Excelente [Nombre]. Queda agendada nuestra sesión técnica presencial para el [Día] a las [Hora] en sus instalaciones. Nuestro Consultor Especialista le enviará una notificación GPS 15 minutos antes de su llegada. ¿Mantenemos como único requerimiento el acceso a la sala de juntas?"'
        },
        {
          type: 'checklist',
          title: 'Checklist ZERO FAIL',
          checklistItems: [
            { id: 'f1', text: 'Cliente validado en CRM (No Duplicado)' },
            { id: 'f2', text: 'Ubicación GPS extraída de Google Maps insertada correctamente en el evento' },
            { id: 'f3', text: 'Decisor Principal etiquetado en el evento de calendario' }
          ]
        }
      ]
    },
    { 
      id: 'KV-PRO-VTA-03', 
      title: 'Seguimiento Omnicanal',
      desc: 'Estrategia de comunicación y acompañamiento a través del pipeline multicanal de Kaivincia.',
      image: 'https://images.unsplash.com/photo-1611162618828-0bea69c36214?w=800&q=80',
      sections: [
        {
          type: 'callout',
          title: 'Automatización y Toque Humano',
          items: [
            'Sincroniza correos electrónicos, llamadas telefónicas e interacciones de chat en una sola línea de tiempo.',
            'Usa recordatorios inteligentes basados en el estado de salud del cliente en el CRM.',
            'Si un lead pasa a estado "En Riesgo", el sistema genera un trigger de alerta de alta prioridad en el Sistema Nervioso Central.'
          ]
        },
        {
          type: 'checklist',
          title: 'Pasos de Acompañamiento Semanal',
          checklistItems: [
            { id: 'o1', text: 'Enviar correo resumen 24h después de la primera llamada.' },
            { id: 'o2', text: 'Efectuar llamada de seguimiento VoIP los días martes o jueves respetando su huso horario.' },
            { id: 'o3', text: 'Actualizar las notas internas del lead en el CRM después de cada contacto.' }
          ]
        }
      ]
    },
  ],
  'KV-PRO-FIELD': [
    {
      id: 'KV-PRO-FIELD-01',
      title: 'Auditorías de Red de Clientes',
      desc: 'Protocolo de campo para el relevamiento de infraestructura de red física y Wi-Fi en plantas industriales de clientes Kaivincia.',
      image: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=800&q=80',
      sections: [
        {
          type: 'callout',
          title: 'Protocolo de Seguridad Física (EHS)',
          items: [
            'Uso obligatorio de casco, botas de seguridad con casquillo dieléctrico y chaleco de alta visibilidad durante toda la estancia en planta.',
            'Seguir estrictamente las políticas de Lock-Out / Tag-Out (LOTO) de energía eléctrica del cliente antes de abrir cualquier gabinete de red.',
            'No manipular fibra óptica activa bajo ninguna circunstancia sin lentes de protección láser certificados.'
          ]
        },
        {
          type: 'steps',
          title: 'Procedimiento de Relevamiento Técnico',
          steps: [
            { label: 'Inspección Visual del IDF/MDF', desc: 'Fotografiar el estado del rack de comunicaciones, etiquetado de cables, orden del cableado (cable management) y ventilación.', type: 'normal' },
            { label: 'Escaneo de Espectro RF (Wi-Fi)', desc: 'Realizar mapas de calor de cobertura inalámbrica utilizando analizadores de espectro en frecuencias de 2.4GHz, 5GHz y 6GHz.', type: 'cyan' },
            { label: 'Prueba de Rendimiento de Enlace', desc: 'Efectuar pruebas iPerf contra servidores locales para mapear ancho de banda, pérdida de paquetes y jitter.', type: 'violet' }
          ]
        },
        {
          type: 'checklist',
          title: 'Checklist de Entrega de Auditoría de Campo',
          checklistItems: [
            { id: 'a1', text: 'Reporte PDF con diagramas topológicos unifilares subido a la base de clientes' },
            { id: 'a2', text: 'Inventario de activos de red con marcas, modelos y números de serie' },
            { id: 'a3', text: 'Listado detallado de riesgos y cuellos de botella de ancho de banda identificados' }
          ]
        }
      ]
    }
  ]
};

export default function SOPManuals() {
  const [activeDept, setActiveDept] = useState('KV-PRO-ADM');
  const [activeDoc, setActiveDoc] = useState('KV-PRO-ADM-01');

  // Asegurar que haya un documento seleccionado por defecto cuando cambia el departamento
  const handleDeptChange = (deptId: string) => {
    setActiveDept(deptId);
    const docs = DOCUMENTS[deptId] || [];
    if (docs.length > 0) {
      setActiveDoc(docs[0].id);
    } else {
      setActiveDoc('');
    }
  };

  const currentDeptDocs = DOCUMENTS[activeDept] || [];
  const doc = currentDeptDocs.find(d => d.id === activeDoc) || currentDeptDocs[0];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex">
      {/* Sidebar Navigation */}
      <div className="w-80 border-r border-white/5 bg-[#080B10] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 border-b border-white/5">
          <div className="h-10 w-10 bg-[#161B22] rounded-xl border border-white/10 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black uppercase italic tracking-widest text-white">Manuales Kaivincia</h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1">Sistemas & Protocolos Operativos</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-[9px] font-mono uppercase text-gray-500 tracking-wider px-2">Departamentos</p>
          <div className="space-y-1">
            {DEPARTMENTS.map(dept => (
              <button 
                key={dept.id}
                onClick={() => handleDeptChange(dept.id)}
                className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest w-full text-left p-3 rounded-xl transition-all ${
                  activeDept === dept.id 
                    ? 'bg-white/5 text-white border border-white/10 shadow-lg' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeDept === dept.id ? dept.color.replace('text-', 'bg-') : 'bg-gray-700'}`} />
                {dept.name}
              </button>
            ))}
          </div>

          <div className="h-px bg-white/5 my-4" />

          {currentDeptDocs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-mono uppercase text-gray-500 tracking-wider px-2">Documentos del Área</p>
              <div className="space-y-1">
                {currentDeptDocs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDoc(d.id)}
                    className={`w-full text-left p-3 text-[10px] uppercase font-mono rounded-xl transition-all border flex items-center justify-between group ${
                      activeDoc === d.id 
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <span className="truncate pr-2">{d.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-600 group-hover:text-cyan-400 transition-colors ${activeDoc === d.id ? 'text-cyan-400' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-[#0B0E14] min-h-screen">
        {/* Dynamic Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-10 relative z-10">
          
          {doc ? (
            <>
              {/* Document Header */}
              <header className="border-b border-white/5 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full font-mono">
                    {doc.id}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Kaivincia Standard v2.3.1</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter shadow-cyan-500/20 drop-shadow-lg text-white">
                  {doc.title}
                </h1>
                <p className="text-gray-400 mt-3 max-w-2xl text-sm leading-relaxed">
                  {doc.desc}
                </p>
              </header>

              {/* Hero Illustration */}
              <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden relative border border-white/10 group shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent z-10" />
                 <img 
                   src={doc.image} 
                   alt={`3D Illustration for ${doc.title}`} 
                   className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
                 />
                 <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22D3EE] animate-pulse" />
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em]">Visual Module Rendered</span>
                 </div>
              </div>

              {/* Dynamic Sections rendering based on selected document */}
              {doc.sections.map((section, sIdx) => {
                switch (section.type) {
                  case 'callout':
                    return (
                      <section key={sIdx} className="bg-[#161B22] border border-[#22D3EE]/30 p-6 rounded-3xl relative overflow-hidden group shadow-lg">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Target className="w-24 h-24 text-[#22D3EE]" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#22D3EE] mb-4 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> {section.title}
                        </h3>
                        <div className="space-y-3 relative z-10">
                          {section.items?.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex gap-2.5 items-start">
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300 leading-relaxed">{item}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    );

                  case 'flowchart':
                    return (
                      <section key={sIdx} className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white">
                          {section.title} <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        
                        <div className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-3xl relative overflow-hidden">
                           <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20" />
                           
                           <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto space-y-4">
                             {section.steps?.map((step, stepIdx) => (
                               <React.Fragment key={stepIdx}>
                                 <div className={`border px-5 py-3 rounded-2xl w-full text-center shadow-lg transition-all hover:scale-[1.02] ${
                                   step.type === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                   step.type === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                   step.type === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
                                   step.type === 'violet' ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' :
                                   'bg-[#161B22] border-white/10 text-white'
                                 }`}>
                                   <p className="text-[9px] font-mono uppercase tracking-[0.15em] opacity-60 mb-0.5">Paso {stepIdx + 1}</p>
                                   <p className="font-bold text-sm uppercase tracking-wider">{step.label}</p>
                                   <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.desc}</p>
                                 </div>
                                 {stepIdx < (section.steps?.length || 0) - 1 && (
                                   <ArrowRight className="w-5 h-5 text-gray-600 rotate-90" />
                                 )}
                               </React.Fragment>
                             ))}
                           </div>
                        </div>
                      </section>
                    );

                  case 'steps':
                    return (
                      <section key={sIdx} className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white">
                          {section.title} <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {section.steps?.map((step, stepIdx) => (
                            <div key={stepIdx} className="bg-[#12161E] border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                step.type === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                                step.type === 'violet' ? 'bg-violet-500/20 text-violet-400' :
                                step.type === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-white/10 text-white'
                              }`}>
                                {stepIdx + 1}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-black text-sm uppercase tracking-wide text-white">{step.label}</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );

                  case 'script':
                    return (
                      <section key={sIdx} className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white">
                          {section.title} <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        <div className="bg-[#161B22] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                           <div className="absolute top-4 right-4 pointer-events-none opacity-5">
                              <Smartphone className="w-24 h-24 text-white" />
                           </div>
                           <p className="text-sm italic text-gray-200 leading-relaxed relative z-10 font-serif border-l-2 border-cyan-400 pl-4">
                             {section.text}
                           </p>
                        </div>
                      </section>
                    );

                  case 'checklist':
                    return (
                      <section key={sIdx} className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-white">
                          {section.title} <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                           {section.checklistItems?.map((item) => (
                             <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                                <div className="mt-0.5 relative flex items-center justify-center w-5 h-5 rounded border border-emerald-500/50 bg-black/50 group-hover:bg-emerald-500/20 transition-colors">
                                   <CheckSquare className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.text}</span>
                             </label>
                           ))}
                        </div>
                      </section>
                    );

                  default:
                    return null;
                }
              })}

              <footer className="pt-12 text-center text-[10px] uppercase font-mono text-gray-600 tracking-[0.2em] opacity-50 pb-12">
                 Propiedad de Kaivincia Corp // Distribución Restringida // © 2026 Kaivincia CRM
              </footer>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <HelpCircle className="w-16 h-16 text-gray-700 animate-pulse" />
              <p className="text-sm text-gray-500 font-mono">Seleccione un departamento y un documento para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
