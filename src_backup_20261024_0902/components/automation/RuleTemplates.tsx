import { useState } from 'react';
import { AutomationRule, Area } from '../../types/automation';
import { AREAS } from '../../config/automationCatalog';
import { 
  Copy, 
  Sparkles, 
  ArrowRight, 
  Search
} from 'lucide-react';

interface RuleTemplatesProps {
  onUseTemplate: (template: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface PrebuiltTemplate {
  id: string;
  name: string;
  description: string;
  area: Area;
  category: string;
  rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'failureCount'>;
}

const TEMPLATES: PrebuiltTemplate[] = [
  // 1. Marketing
  {
    id: 'tpl_mkt_1',
    name: 'Lead de Meta Instant Forms con Teléfono Válido',
    description: 'Cuando ingrese un lead desde formulario de Facebook/Instagram, registrarlo en el CRM y asignar automáticamente al setter.',
    area: 'Marketing',
    category: 'Captación',
    rule: {
      name: 'Captación Meta: Formulario Instantáneo a Setter',
      description: 'Crea prospecto en CRM y alerta al setter de guardia',
      area: 'Marketing',
      event: 'NUEVO_LEAD_FORMULARIO_META',
      conditions: [
        {
          id: 'c1',
          field: 'canal',
          operator: 'equals',
          value: 'meta_instant_forms',
          logic: 'AND'
        }
      ],
      actions: [
        {
          id: 'a1',
          type: 'crear_contacto',
          params: { origen: 'Meta Instant Forms', etiqueta: 'Calificado' },
          order: 1,
          responsibleRole: 'setter',
          delayMinutes: 0,
          isEnabled: true,
          fallback: {
            type: 'enviar_notificacion_interna',
            params: { mensaje: 'Error al crear contacto desde Meta' },
            responsibleRole: 'supervisor',
            notifySupervisor: true
          }
        },
        {
          id: 'a2',
          type: 'asignar_setter',
          params: { modo: 'rotativo' },
          order: 2,
          responsibleRole: 'setter',
          delayMinutes: 0,
          isEnabled: true
        }
      ],
      isActive: true,
      isApproved: true,
      createdBy: 'template'
    }
  },
  // 2. CRM & Ventas
  {
    id: 'tpl_vnt_1',
    name: 'Asignación Express de Lead Calificado con Cita Agendada',
    description: 'Cuando se agende una cita con un prospecto, crear tarea de llamada urgente y notificar al closer.',
    area: 'CRM_Ventas',
    category: 'Conversión',
    rule: {
      name: 'Cita Agendada: Notificación Express al Asesor',
      description: 'Dispara asignación automática y recordatorio urgente de llamada de venta',
      area: 'CRM_Ventas',
      event: 'CITA_AGENDADA',
      conditions: [
        {
          id: 'c1',
          field: 'etapa_pipeline',
          operator: 'equals',
          value: 'cita_agendada',
          logic: 'AND'
        }
      ],
      actions: [
        {
          id: 'a1',
          type: 'crear_tarea',
          params: { titulo: 'Llamada de Venta Express (<15min)', prioridad: 'urgente' },
          order: 1,
          responsibleRole: 'closer',
          delayMinutes: 0,
          isEnabled: true
        },
        {
          id: 'a2',
          type: 'enviar_notificacion_interna',
          params: { mensaje: 'Nueva cita agendada en calendario de ventas' },
          order: 2,
          responsibleRole: 'closer',
          delayMinutes: 0,
          isEnabled: true
        }
      ],
      isActive: true,
      isApproved: true,
      createdBy: 'template'
    }
  },
  // 3. Academy & Alumnos
  {
    id: 'tpl_acad_1',
    name: 'Onboarding Automatizado de Alumno Matriculado',
    description: 'Cuando el alumno se inscribe a un curso, enviar credenciales de aula virtual y notificar al tutor.',
    area: 'Academy',
    category: 'Onboarding',
    rule: {
      name: 'Bienvenida Operativa y Asignación de Tutor',
      description: 'Genera credenciales y notifica al área académica',
      area: 'Academy',
      event: 'ALUMNO_INSCRITO',
      conditions: [
        {
          id: 'c1',
          field: 'curso_id',
          operator: 'is_not_empty',
          value: '',
          logic: 'AND'
        }
      ],
      actions: [
        {
          id: 'a1',
          type: 'enviar_email',
          params: { plantilla: 'credenciales_acceso_campus' },
          order: 1,
          responsibleRole: 'gestor',
          delayMinutes: 0,
          isEnabled: true
        },
        {
          id: 'a2',
          type: 'enviar_notificacion_interna',
          params: { mensaje: 'Nuevo alumno listo para onboarding' },
          order: 2,
          responsibleRole: 'tutor',
          delayMinutes: 0,
          isEnabled: true
        }
      ],
      isActive: true,
      isApproved: true,
      createdBy: 'template'
    }
  },
  // 4. Facturación & Cobranzas
  {
    id: 'tpl_fin_1',
    name: 'Alerta de Factura Vencida con Recordatorio Amable',
    description: 'Cuando una factura vence sin liquidarse, enviar recordatorio vía WhatsApp y alertar al supervisor.',
    area: 'Facturacion',
    category: 'Cobranzas',
    rule: {
      name: 'Cobranza Preventiva: Factura Vencida',
      description: 'Dispara WhatsApp de regularización y alerta a administración',
      area: 'Facturacion',
      event: 'FACTURA_VENCIDA',
      conditions: [
        {
          id: 'c1',
          field: 'monto_factura',
          operator: 'greater_than',
          value: 0,
          logic: 'AND'
        }
      ],
      actions: [
        {
          id: 'a1',
          type: 'enviar_whatsapp',
          params: { plantilla: 'recordatorio_cuota_vencida' },
          order: 1,
          responsibleRole: 'admin',
          delayMinutes: 0,
          isEnabled: true
        },
        {
          id: 'a2',
          type: 'alertar_supervisor',
          params: { nivel: 'moderado' },
          order: 2,
          responsibleRole: 'admin',
          delayMinutes: 0,
          isEnabled: true
        }
      ],
      isActive: true,
      isApproved: true,
      createdBy: 'template'
    }
  },
  // 5. Atención & Soporte
  {
    id: 'tpl_cs_1',
    name: 'Escalación Inmediata de Ticket Crítico a Supervisión',
    description: 'Si se abre un ticket de atención, alertar al supervisor en menos de 5 minutos.',
    area: 'Atencion',
    category: 'Escalación',
    rule: {
      name: 'SLA Crítico: Ticket Abierto a Supervisor',
      description: 'Evita demoras en quejas críticas o bloqueos de acceso al campus',
      area: 'Atencion',
      event: 'TICKET_ABIERTO',
      conditions: [
        {
          id: 'c1',
          field: 'canal_comunicacion',
          operator: 'is_not_empty',
          value: '',
          logic: 'AND'
        }
      ],
      actions: [
        {
          id: 'a1',
          type: 'enviar_notificacion_interna',
          params: { mensaje: 'ALERTA TICKET URGENTE: Requiere atención prioritaria' },
          order: 1,
          responsibleRole: 'supervisor',
          delayMinutes: 0,
          isEnabled: true
        }
      ],
      isActive: true,
      isApproved: true,
      createdBy: 'template'
    }
  },
  // 6. Operaciones & Proyectos
  {
    id: 'tpl_ops_1',
    name: 'Control de Retrasos en Tareas Operativas Vencidas',
    description: 'Cuando una tarea operativa vence sin finalizarse, alertar al supervisor del proyecto.',
    area: 'Operaciones',
    category: 'Gestión',
    rule: {
      name: 'Control Operativo: Tarea Vencida',
      description: 'Protege los plazos de entrega y compromisos con los clientes',
      area: 'Operaciones',
      event: 'TAREA_VENCIDA',
      conditions: [
        {
          id: 'c1',
          field: 'estado_tarea',
          operator: 'not_equals',
          value: 'completada',
          logic: 'AND'
        }
      ],
      actions: [
        {
          id: 'a1',
          type: 'enviar_notificacion_interna',
          params: { mensaje: 'Tarea operativa con plazo de entrega vencido' },
          order: 1,
          responsibleRole: 'supervisor',
          delayMinutes: 0,
          isEnabled: true
        },
        {
          id: 'a2',
          type: 'alertar_supervisor',
          params: { nivel: 'critico' },
          order: 2,
          responsibleRole: 'supervisor',
          delayMinutes: 0,
          isEnabled: true
        }
      ],
      isActive: true,
      isApproved: true,
      createdBy: 'template'
    }
  }
];

export default function RuleTemplates({ onUseTemplate }: RuleTemplatesProps) {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter((t) => {
    if (selectedArea !== 'all' && t.area !== selectedArea) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-black text-white uppercase italic tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            Catálogo de Plantillas Listas para Clonar
          </h3>
          <p className="text-xs text-slate-400">
            Mejores prácticas operativas ya probadas por área de negocio. Puedes clonarlas y ajustarlas a tu medida.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar plantilla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#00F0FF]"
            />
          </div>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F0FF]"
          >
            <option value="all">Todas las Áreas</option>
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cuadrícula de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800/90 hover:border-[#00F0FF]/40 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-[#00F0FF] border border-blue-800/80">
                  {tpl.area}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {tpl.category}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#00F0FF] transition-colors leading-snug">
                  {tpl.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              {/* Resumen de Disparador y Acciones */}
              <div className="p-3 rounded-2xl bg-black/50 border border-slate-900 space-y-1.5 text-[11px] font-mono">
                <div className="text-amber-400">
                  ⚡ <strong>Evento:</strong> {tpl.rule.event}
                </div>
                <div className="text-emerald-400">
                  ✓ <strong>Condiciones:</strong> {tpl.rule.conditions.length} definidas
                </div>
                <div className="text-[#00F0FF]">
                  → <strong>Acciones:</strong> {tpl.rule.actions.length} encadenadas
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() =>
                  onUseTemplate({
                    ...tpl.rule,
                    executionCount: 0,
                    failureCount: 0
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-[#00F0FF] text-white hover:text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group-hover:bg-[#00F0FF] group-hover:text-black"
              >
                <Copy className="w-3.5 h-3.5" />
                Usar Esta Plantilla
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
