import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, MessageSquare, Calendar, Compass, FileText, ChevronLeft, 
  ChevronRight, MapPin, ExternalLink, User, Clock, AlertTriangle, 
  CheckCircle2, DollarSign, Sparkles, Building2, Megaphone
} from 'lucide-react';
import { LeadOpportunity, PipelineStage, AppointmentData } from '../../types/crm';
import CardHeaderAbatible from './CardHeaderAbatible';
import { buildGoogleCalendarUrl } from '../../utils/googleCalendar';

interface Props {
  leads: LeadOpportunity[];
  pipelineColumns: { id: PipelineStage; label: string; color: string; badgeBg: string }[];
  onMove: (leadId: string, direction: 'prev' | 'next') => void;
  onOpenAppointment: (lead: LeadOpportunity) => void;
  onOpenGps: (lead: LeadOpportunity) => void;
  onOpenNotes: (lead: LeadOpportunity) => void;
  onReassignTLMK: (leadId: string, newTLMK: string) => void;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string, name: string) => void;
  onSaveLeadHeader: (leadId: string, updatedData: Partial<LeadOpportunity>) => Promise<void>;
  tlmkList: string[];
  size: 'sm' | 'md' | 'lg';
}

export default function PipelineListView({
  leads,
  pipelineColumns,
  onMove,
  onOpenAppointment,
  onOpenGps,
  onOpenNotes,
  onReassignTLMK,
  onCall,
  onWhatsApp,
  onSaveLeadHeader,
  tlmkList,
  size
}: Props) {
  const navigate = useNavigate();
  const [openAbatibleId, setOpenAbatibleId] = useState<string | null>(null);

  // Icon and spacing sizes based on density selection
  const iconSizeClass = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const actionButtonPadding = size === 'lg' ? 'px-3 py-2 text-xs' : size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-[11px]';
  const cardPadding = size === 'lg' ? 'p-5' : size === 'sm' ? 'p-3' : 'p-4';

  const handleOpenAgenda = (lead: LeadOpportunity) => {
    navigate('/crm/calendar');
  };

  if (leads.length === 0) {
    return (
      <div className="bg-[#0A0D14] border border-slate-800 rounded-3xl p-12 text-center">
        <p className="text-slate-400 font-medium">No hay oportunidades que coincidan con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {leads.map((lead) => {
        const currentIdx = pipelineColumns.findIndex(c => c.id === lead.pipelineStage);
        const currentColumn = pipelineColumns[currentIdx] || pipelineColumns[0];
        const canMovePrev = currentIdx > 0;
        const canMoveNext = currentIdx < pipelineColumns.length - 1;

        const isOverdue = lead.isOverdue || (
          lead.pipelineStage === 'LEAD_IN' && 
          (Date.now() - new Date(lead.createdAt || Date.now()).getTime()) > 24 * 3600 * 1000
        );

        const mapsUrl = lead.appointment?.address 
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.appointment.address)}`
          : lead.appointment?.gpsCoordinates
            ? `https://www.google.com/maps/search/?api=1&query=${lead.appointment.gpsCoordinates.lat},${lead.appointment.gpsCoordinates.lng}`
            : null;

        return (
          <div
            key={lead.id}
            className={`bg-[#0D121D] border rounded-2xl transition-all duration-200 shadow-md hover:border-slate-700 ${cardPadding} ${
              isOverdue ? 'ring-1 ring-red-500/40 bg-red-950/10' : 'border-slate-800'
            }`}
          >
            {/* Cabezal Editable con Ventana Abatible y Status Persistente */}
            <CardHeaderAbatible
              lead={lead}
              isOpen={openAbatibleId === lead.id}
              onToggle={() => setOpenAbatibleId(openAbatibleId === lead.id ? null : lead.id)}
              onSave={onSaveLeadHeader}
              pipelineColumns={pipelineColumns}
              tlmkList={tlmkList}
              size={size}
            />

            {/* Fila Principal de Información y Acciones */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Teléfono y Marcador Directo */}
              <div className="md:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCall(lead.phone)}
                    className={`${size === 'lg' ? 'w-9 h-9' : 'w-7 h-7'} rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-sm`}
                    title="Llamar con Discador VoIP"
                  >
                    <Phone className={iconSizeClass} />
                  </button>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-500 block leading-none">Teléfono</span>
                    <span className={`${size === 'lg' ? 'text-sm' : 'text-xs'} font-mono font-bold text-emerald-400`}>
                      {lead.phone}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onWhatsApp(lead.phone, lead.name)}
                  className="px-2 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Abrir WhatsApp"
                >
                  <MessageSquare className="w-3 h-3" /> WhatsApp
                </button>
              </div>

              {/* TLMK Asignado y Valor */}
              <div className="md:col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-900/50 border border-slate-800/80 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase text-slate-400">TLMK:</span>
                  <select
                    value={lead.assignedTLMK || 'Sin Asignar'}
                    onChange={(e) => onReassignTLMK(lead.id, e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[11px] text-white rounded-lg px-2 py-0.5 focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    {tlmkList.map((t) => (
                      <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                    ))}
                  </select>
                </div>

                {(lead.contractValue || lead.dealValue) && (
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{(lead.contractValue || lead.dealValue)?.toLocaleString()} USD</span>
                  </div>
                )}
              </div>

              {/* Botones de Operación (Cita, GPS, Notas) */}
              <div className="md:col-span-4 flex items-center gap-2 flex-wrap">
                {/* Botón Cita (Agendar en Google Calendar) */}
                <button
                  onClick={() => onOpenAppointment(lead)}
                  className={`rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${actionButtonPadding}`}
                  title="Agendar o editar Cita (Google Calendar)"
                >
                  <Calendar className={iconSizeClass} />
                  <span>{lead.appointment ? 'Cita Agendada' : 'Agendar Cita'}</span>
                </button>

                {/* Acceso Directo a Agenda & Reuniones si ya tiene cita */}
                {lead.appointment && (
                  <button
                    onClick={() => handleOpenAgenda(lead)}
                    className={`rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${actionButtonPadding}`}
                    title="Ver en la Agenda & Reuniones de la app"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Ver Agenda</span>
                  </button>
                )}

                {/* Botón GPS */}
                <button
                  onClick={() => onOpenGps(lead)}
                  className={`rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${actionButtonPadding}`}
                  title="Verificación GPS y Feedback"
                >
                  <Compass className={iconSizeClass} />
                  <span>GPS</span>
                </button>

                {/* Botón Notas */}
                <button
                  onClick={() => onOpenNotes(lead)}
                  className={`rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${actionButtonPadding}`}
                  title="Ver y agregar notas"
                >
                  <FileText className={iconSizeClass} />
                  <span>Notas ({lead.notes?.length || 0})</span>
                </button>
              </div>

              {/* Botones de Avance de Estado */}
              <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                <button
                  disabled={!canMovePrev}
                  onClick={() => onMove(lead.id, 'prev')}
                  className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black disabled:opacity-20 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase"
                  title="Retroceder estado anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  disabled={!canMoveNext}
                  onClick={() => onMove(lead.id, 'next')}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-400 hover:text-black disabled:opacity-20 disabled:hover:bg-emerald-500/20 disabled:hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase shadow-[0_0_10px_rgba(52,211,153,0.15)]"
                  title="Avanzar al siguiente estado (Flecha Verde)"
                >
                  <span>Avanzar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CAJA GPS Y DIRECCIÓN DONDE FUE AGENDADO (Si tiene Cita registrada) */}
            {lead.appointment && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 bg-black/30 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cita: {lead.appointment.date} a las {lead.appointment.time} ({lead.appointment.type})</span>
                  </div>

                  <span className="text-slate-600 hidden sm:inline">•</span>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium">
                      Dirección agendada: <strong className="text-white">{lead.appointment.address || 'Oficina'}</strong>
                      {lead.appointment.direction && <span className="text-slate-400"> ({lead.appointment.direction})</span>}
                    </span>
                  </div>

                  {lead.appointment.gpsCoordinates && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      GPS: {lead.appointment.gpsCoordinates.lat}°, {lead.appointment.gpsCoordinates.lng}°
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver Dirección en Mapa
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenAgenda(lead)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3 h-3" /> Ver en Agenda & Reuniones
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
