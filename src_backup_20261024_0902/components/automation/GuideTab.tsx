import { useState } from 'react';
import { AREAS } from '../../config/automationCatalog';
import { 
  BookOpen, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Workflow, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export default function GuideTab() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Qué es el modelo "Cuando / Si / Hacer" y por qué no requiere programar?',
      a: 'Es la metodología de diseño de procesos más intuitiva: "Cuando" define el suceso inicial (ej: Lead entra por Instagram), "Si" evalúa las condiciones o filtros de calificación (ej: el mensaje contiene "PERFIL"), y "Hacer" ejecuta las acciones ordenadas de negocio (ej: crear prospecto en CRM y asignar setter).'
    },
    {
      q: '¿Qué ocurre si una acción externa (ej: API de WhatsApp o Meta) falla?',
      a: 'Cada acción cuenta con un bloque de Contingencia (Fallback). Si la API devuelve un error o se agota el tiempo de respuesta, el sistema dispara automáticamente la acción de rescate configurada (por ejemplo, notificar a un supervisor o generar una tarea manual urgente).'
    },
    {
      q: '¿Cómo funciona el Simulador (Dry-Run)?',
      a: 'El simulador te permite ingresar datos ficticios del evento y observar paso a paso si las condiciones se cumplirían y qué acciones se dispararían, con qué tiempos de espera y hacia qué responsables, sin modificar jamás datos reales en la base de datos.'
    },
    {
      q: '¿Quién puede activar o modificar automatizaciones de alto impacto?',
      a: 'El sistema implementa Control de Acceso Basado en Roles (RBAC). Los operadores y gestores pueden proponer reglas en estado borrador, pero la activación y aprobación de reglas que modifiquen estados financieros o de seguridad requiere el rol de Administrador o Supervisor General.'
    },
    {
      q: '¿Dónde se audita lo que ha hecho una automatización?',
      a: 'En la pestaña "Historial y Auditoría" se registra cada disparo en tiempo real con su tiempo de ejecución en milisegundos, los datos entrantes, el resultado de cada condición y el estado de cada acción, con opción de reintento para ejecuciones fallidas.'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Banner de Bienvenida y Filosofía */}
      <div className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tight">
              Manual Operativo y Estándares de Automatización (SOP)
            </h2>
            <p className="text-xs text-slate-400">
              Guía de referencia para diseñar flujos limpios, confiables y con contingencia operativa en las 8 áreas del negocio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 1. Cuando (Disparador)
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Selecciona el evento originario de entre los eventos auditados por cada área.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Workflow className="w-4 h-4" /> 2. Si (Condiciones)
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aplica filtros combinados con lógica AND / OR sin necesidad de fórmulas matemáticas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-slate-800/80 space-y-1.5">
            <span className="text-xs font-bold text-[#00F0FF] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 3. Hacer (Acciones + Fallback)
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Encadena acciones secuenciales con roles asignados, tiempos de espera y plan de rescate.
            </p>
          </div>
        </div>
      </div>

      {/* Matriz de Áreas y Responsables */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
          <Workflow className="w-4 h-4 text-[#00F0FF]" />
          Matriz de Automatizaciones por Área de Negocio
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AREAS.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="text-xs font-bold text-white">{a.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {a.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Preguntas Frecuentes (FAQ) */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#00F0FF]" />
          Preguntas Frecuentes y Políticas Operativas
        </h3>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                      {index + 1}
                    </span>
                    {faq.q}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#00F0FF]" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-900 bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
