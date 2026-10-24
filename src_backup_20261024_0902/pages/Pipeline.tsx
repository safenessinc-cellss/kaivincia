import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Phone, MessageSquare, Calendar, Compass, FileText, ChevronLeft, ChevronRight, 
  Plus, UploadCloud, Search, Filter, AlertTriangle, CheckCircle2, User, Clock,
  ArrowRight, Megaphone, Zap, ShieldCheck, Sparkles, Kanban, List, ExternalLink, MapPin
} from 'lucide-react';
import { 
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor, 
  KeyboardSensor, DragStartEvent, DragEndEvent, useDroppable, useDraggable 
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { LeadOpportunity, PipelineStage, AppointmentData } from '../types/crm';
import ManualContactModal from '../components/pipeline/ManualContactModal';
import MetaImportModal from '../components/pipeline/MetaImportModal';
import AppointmentModal from '../components/pipeline/AppointmentModal';
import GpsFeedbackModal from '../components/pipeline/GpsFeedbackModal';
import LeadNotesModal from '../components/pipeline/LeadNotesModal';
import CardHeaderAbatible from '../components/pipeline/CardHeaderAbatible';
import PipelineListView from '../components/pipeline/PipelineListView';
import { buildGoogleCalendarUrl } from '../utils/googleCalendar';
import { useNavigate } from 'react-router-dom';

const PIPELINE_COLUMNS: { id: PipelineStage; label: string; color: string; badgeBg: string }[] = [
  { id: 'LEAD_IN', label: 'Nuevos Leads (Meta Ads)', color: 'border-slate-700 text-slate-300', badgeBg: 'bg-slate-800 text-slate-300' },
  { id: 'CONTACTADO', label: 'Contactado (En Marcación)', color: 'border-amber-500/40 text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-400' },
  { id: 'SEGUIMIENTO', label: 'En Seguimiento / Reprogramado', color: 'border-blue-500/40 text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-400' },
  { id: 'CITA_AGENDADA', label: 'Cita Agendada', color: 'border-purple-500/40 text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-400' },
  { id: 'CITA_CUMPLIDA', label: 'Cita Cumplida (GPS Verificada)', color: 'border-emerald-500/40 text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'CIERRE', label: 'Cierre Ganado / Venta', color: 'border-[#00F0FF]/40 text-[#00F0FF]', badgeBg: 'bg-[#00F0FF]/10 text-[#00F0FF]' },
  { id: 'NO_INTERESADO', label: 'No Interesado / Descartado', color: 'border-red-500/40 text-red-400', badgeBg: 'bg-red-500/10 text-red-400' },
];

const TLMK_AGENTS = [
  'Zaydeli De La Rosa',
  'Marta García',
  'Carlos Méndez',
  'Agente Comercial General'
];

interface CardProps {
  lead: LeadOpportunity;
  onMove: (leadId: string, direction: 'prev' | 'next') => void;
  onOpenAppointment: (lead: LeadOpportunity) => void;
  onOpenGps: (lead: LeadOpportunity) => void;
  onOpenNotes: (lead: LeadOpportunity) => void;
  onReassignTLMK: (leadId: string, newTLMK: string) => void;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string, name: string) => void;
  tlmkList: string[];
  openAbatibleId?: string | null;
  setOpenAbatibleId?: (id: string | null) => void;
  onSaveLeadHeader?: (leadId: string, updatedData: Partial<LeadOpportunity>) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
}

function KanbanCard({ 
  lead, onMove, onOpenAppointment, onOpenGps, onOpenNotes, onReassignTLMK, onCall, onWhatsApp, tlmkList,
  openAbatibleId, setOpenAbatibleId, onSaveLeadHeader, size = 'md'
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: lead
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const currentIdx = PIPELINE_COLUMNS.findIndex(c => c.id === lead.pipelineStage);
  const canMovePrev = currentIdx > 0;
  const canMoveNext = currentIdx < PIPELINE_COLUMNS.length - 1;

  // Overdue calculation (leads with no contact in > 24 hours or past appointment)
  const isOverdue = lead.isOverdue || (
    lead.pipelineStage === 'LEAD_IN' && 
    (Date.now() - new Date(lead.createdAt || Date.now()).getTime()) > 24 * 3600 * 1000
  );

  const isAbatibleOpen = openAbatibleId === lead.id;
  const handleToggleAbatible = () => {
    if (setOpenAbatibleId) {
      setOpenAbatibleId(isAbatibleOpen ? null : lead.id);
    }
  };

  const navigate = useNavigate();

  const handleOpenAppAgenda = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/crm/calendar');
  };

  // Size styling maps
  const paddingClass = size === 'sm' ? 'p-3' : size === 'lg' ? 'p-5' : 'p-4';
  const iconSizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#0D121D] border rounded-2xl ${paddingClass} transition-all duration-200 group relative ${
        isDragging ? 'opacity-30 border-dashed border-cyan-500' : 'border-slate-800 hover:border-slate-700 shadow-lg hover:shadow-cyan-950/20'
      } ${isOverdue ? 'ring-1 ring-red-500/50 bg-red-950/10' : ''}`}
    >
      {/* Top badges & Drag handle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Megaphone className={iconSizeClass} />
            {lead.campaignName || 'Meta Ads'}
          </span>
          {isOverdue && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 animate-pulse">
              <AlertTriangle className={iconSizeClass} />
              Atrasado
            </span>
          )}
        </div>

        {/* Drag handle */}
        <div {...listeners} {...attributes} className="cursor-grab text-slate-600 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800 transition-colors" title="Arrastrar tarjeta">
          <div className="flex flex-col gap-0.5">
            <span className="w-3.5 h-0.5 bg-slate-500 rounded-full" />
            <span className="w-3.5 h-0.5 bg-slate-500 rounded-full" />
            <span className="w-3.5 h-0.5 bg-slate-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Editable Header with Collapsible Window (Ventana Abatible) & Always Visible Status */}
      <div className="mb-3">
        <CardHeaderAbatible
          lead={lead}
          isOpen={isAbatibleOpen}
          onToggle={handleToggleAbatible}
          onSave={onSaveLeadHeader || (async () => {})}
          size={size}
          pipelineColumns={PIPELINE_COLUMNS}
          tlmkList={tlmkList}
        />
      </div>

      {/* Phone Number with Instant Dial & WhatsApp */}
      <div className={`bg-slate-900/90 border border-slate-800 rounded-xl ${size === 'sm' ? 'p-2 mb-2' : size === 'lg' ? 'p-3 mb-3.5' : 'p-2.5 mb-3'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCall(lead.phone)}
            className={`${size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7'} rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-sm`}
            title="Llamar con Discador VoIP"
          >
            <Phone className={iconSizeClass} />
          </button>
          <div>
            <span className="text-[9px] font-mono uppercase text-slate-500 block leading-none">Teléfono</span>
            <span className={`${size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-sm' : 'text-xs'} font-mono font-bold text-emerald-400`}>{lead.phone}</span>
          </div>
        </div>

        <button
          onClick={() => onWhatsApp(lead.phone, lead.name)}
          className={`px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'} font-bold flex items-center gap-1 transition-all cursor-pointer`}
          title="Abrir WhatsApp"
        >
          <MessageSquare className={iconSizeClass} /> WhatsApp
        </button>
      </div>

      {/* TLMK Assignment */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <User className={`${iconSizeClass} text-cyan-400`} />
          <span>TLMK:</span>
        </div>
        <select
          value={lead.assignedTLMK || 'Sin Asignar'}
          onChange={(e) => onReassignTLMK(lead.id, e.target.value)}
          className="bg-slate-900 border border-slate-800 text-[10px] text-white rounded-lg px-2 py-0.5 focus:outline-none focus:border-cyan-500 font-bold"
        >
          {tlmkList.map((t) => (
            <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
          ))}
        </select>
      </div>

      {/* GPS & DIRECCIÓN AGENDADA BOX (Si la cita fue agendada) */}
      {lead.appointment && (
        <div className="mb-3 bg-purple-950/20 border border-purple-800/40 rounded-xl p-2.5 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-purple-300 font-bold">
            <span className="flex items-center gap-1">
              <Calendar className={iconSizeClass} />
              {lead.appointment.date} {lead.appointment.time}
            </span>
            {lead.appointment.gpsVerified && (
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-black flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> GPS OK
              </span>
            )}
          </div>

          {/* Dirección agendada */}
          <div className="flex items-start gap-1 text-slate-300 text-[10px] leading-tight">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-slate-400 block font-semibold text-[9px] uppercase">Dirección Agendada:</span>
              <span className="text-slate-200 line-clamp-2">{lead.appointment.address || 'Ubicación sin especificar'}</span>
              {lead.appointment.direction && (
                <span className="text-amber-300 block text-[9px] italic mt-0.5">({lead.appointment.direction})</span>
              )}
            </div>
          </div>

          {/* Action buttons inside GPS box: Google Calendar & Google Maps */}
          <div className="pt-1.5 border-t border-purple-900/40 flex items-center justify-between gap-1">
            <button
              onClick={handleOpenAppAgenda}
              className="px-2 py-1 rounded-md bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-black border border-cyan-500/30 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Ver en la Agenda & Reuniones de la app"
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>Ver en Agenda</span>
            </button>

            {lead.appointment.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.appointment.address)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-1 transition-all"
                title="Abrir ubicación en Google Maps"
              >
                <Compass className="w-2.5 h-2.5" />
                <span>Google Maps</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Action buttons (Agendar Cita, GPS, Notas) */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <button
          onClick={() => onOpenAppointment(lead)}
          className={`py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'} font-bold flex items-center justify-center gap-1 transition-all cursor-pointer`}
          title="Agendar Cita en Google Calendar"
        >
          <Calendar className={iconSizeClass} /> Cita
        </button>
        <button
          onClick={() => onOpenGps(lead)}
          className={`py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'} font-bold flex items-center justify-center gap-1 transition-all cursor-pointer`}
          title="Verificación GPS y Feedback"
        >
          <Compass className={iconSizeClass} /> GPS
        </button>
        <button
          onClick={() => onOpenNotes(lead)}
          className={`py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'} font-bold flex items-center justify-center gap-1 transition-all cursor-pointer`}
          title="Ver y agregar notas"
        >
          <FileText className={iconSizeClass} /> Notas ({lead.notes?.length || 0})
        </button>
      </div>

      {/* GREEN ARROWS TO MOVE STATUS WITH A SINGLE CLICK */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <button
          disabled={!canMovePrev}
          onClick={() => onMove(lead.id, 'prev')}
          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black disabled:opacity-20 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase"
          title="Retroceder estado anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>

        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
          Mover Estatus
        </span>

        <button
          disabled={!canMoveNext}
          onClick={() => onMove(lead.id, 'next')}
          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-400 hover:text-black disabled:opacity-20 disabled:hover:bg-emerald-500/20 disabled:hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase shadow-[0_0_10px_rgba(52,211,153,0.15)]"
          title="Avanzar al siguiente estado (Flecha Verde)"
        >
          <span>Avanzar</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function DroppableColumn({ 
  column, leads, onMove, onOpenAppointment, onOpenGps, onOpenNotes, onReassignTLMK, onCall, onWhatsApp, tlmkList,
  openAbatibleId, setOpenAbatibleId, onSaveLeadHeader, size
}: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 bg-[#0A0D14] border rounded-3xl flex flex-col transition-all duration-200 overflow-hidden ${
        isOver ? 'border-emerald-500/60 bg-[#0F1420] shadow-[0_0_30px_rgba(52,211,153,0.15)]' : 'border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${column.badgeBg}`} />
            {column.label}
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-white">
          {leads.length}
        </span>
      </div>

      {/* Column Cards */}
      <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar min-h-[400px]">
        {leads.map((lead: LeadOpportunity) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onMove={onMove}
            onOpenAppointment={onOpenAppointment}
            onOpenGps={onOpenGps}
            onOpenNotes={onOpenNotes}
            onReassignTLMK={onReassignTLMK}
            onCall={onCall}
            onWhatsApp={onWhatsApp}
            tlmkList={tlmkList}
            openAbatibleId={openAbatibleId}
            setOpenAbatibleId={setOpenAbatibleId}
            onSaveLeadHeader={onSaveLeadHeader}
            size={size}
          />
        ))}

        {leads.length === 0 && (
          <div className="h-40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 text-center text-slate-600 text-xs">
            <span>Sin oportunidades aquí</span>
            <span className="text-[10px] text-slate-700 mt-1">Usa las flechas verdes o arrastra</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTLMK, setSelectedTLMK] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // View Mode (Kanban vs Lista) & Card/Icon Size (sm, md, lg)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [openAbatibleId, setOpenAbatibleId] = useState<string | null>(null);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeAppointmentLead, setActiveAppointmentLead] = useState<LeadOpportunity | null>(null);
  const [activeGpsLead, setActiveGpsLead] = useState<LeadOpportunity | null>(null);
  const [activeNotesLead, setActiveNotesLead] = useState<LeadOpportunity | null>(null);

  // Drag overlay
  const [draggedLead, setDraggedLead] = useState<LeadOpportunity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const { user: currentUser, loading: authLoading } = useAuth();

  // Listen to Firestore clients collection
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data: LeadOpportunity[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name || d.companyName || 'Lead Sin Nombre',
          companyName: d.companyName || d.company,
          phone: d.phone || d.telefono || '+12135550192',
          email: d.email,
          source: d.source || 'meta_ads',
          campaignName: d.campaignName || 'Campaña Meta Ads USA',
          pipelineStage: d.pipelineStage || 'LEAD_IN',
          assignedTLMK: d.assignedTLMK || d.setterName || 'Zaydeli De La Rosa',
          contractValue: d.contractValue || d.amount || 3000,
          healthScore: d.healthScore || 90,
          isOverdue: Boolean(d.isOverdue),
          appointment: d.appointment,
          notes: d.notes || [],
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString()
        } as LeadOpportunity;
      });

      // Default sample leads if database has no records yet
      if (data.length === 0) {
        data = [
          {
            id: 'meta-lead-1',
            name: 'Carlos Mendoza',
            companyName: 'Mendoza Logistics LLC',
            phone: '+1 (213) 489-3320', // California 213
            email: 'carlos@mendozalog.com',
            source: 'meta_ads',
            campaignName: 'Meta Ads: Crecimiento Empresarial California',
            pipelineStage: 'LEAD_IN',
            assignedTLMK: 'Zaydeli De La Rosa',
            contractValue: 4500,
            healthScore: 95,
            isOverdue: true,
            createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [{
              id: 'n_1',
              author: 'Meta Lead Ads API',
              text: 'Interesado en escalamiento de operaciones. Formulario completado en Instagram.',
              createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
            }]
          },
          {
            id: 'meta-lead-2',
            name: 'Elena Rostova',
            companyName: 'Empire Real Estate NY',
            phone: '+1 (631) 890-4412', // New York 631
            email: 'elena@empirerealty.com',
            source: 'meta_ads',
            campaignName: 'Meta Ads: Inversionistas NY & NJ',
            pipelineStage: 'CONTACTADO',
            assignedTLMK: 'Zaydeli De La Rosa',
            contractValue: 8000,
            healthScore: 88,
            createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [{
              id: 'n_2',
              author: 'Meta Lead Ads API',
              text: 'Preguntó por integración CRM y discador. Requiere llamada matutina.',
              createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
            }]
          },
          {
            id: 'meta-lead-3',
            name: 'David Steinberg',
            companyName: 'Denver Peaks Consulting',
            phone: '+1 (720) 651-7890', // Colorado 720
            email: 'david@denverpeaks.co',
            source: 'meta_ads',
            campaignName: 'Meta Ads: Consultoría High Ticket',
            pipelineStage: 'SEGUIMIENTO',
            assignedTLMK: 'Marta García',
            contractValue: 12000,
            healthScore: 92,
            createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [{
              id: 'n_3',
              author: 'Marta García',
              text: 'Llamada inicial realizada. Muy receptivo, solicita propuesta y agendar reunión.',
              createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
            }]
          },
          {
            id: 'meta-lead-4',
            name: 'Marcos Aurelio Santos',
            companyName: 'Santos & Brothers Corp',
            phone: '+1 (856) 412-9901', // New Jersey 856
            email: 'marcos@santostrucking.com',
            source: 'meta_ads',
            campaignName: 'Meta Ads: Soluciones Financieras NJ',
            pipelineStage: 'CITA_AGENDADA',
            assignedTLMK: 'Zaydeli De La Rosa',
            contractValue: 6500,
            healthScore: 96,
            appointment: {
              date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
              time: '11:00',
              assignedAgent: 'Supervisor Comercial',
              type: 'videollamada',
              address: 'Google Meet / Zoom Virtual',
              status: 'programada',
              notes: 'Revisión de plan de servicios y cierre comercial.'
            },
            createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            notes: [{
              id: 'n_4',
              author: 'Zaydeli De La Rosa',
              text: 'Cita coordinada con éxito para mañana a las 11:00 AM.',
              createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
            }]
          }
        ];
      }

      setLeads(data);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore listener handled gracefully:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // TLMK Filter
      if (selectedTLMK !== 'all' && l.assignedTLMK !== selectedTLMK) {
        return false;
      }
      // Overdue filter
      if (filterOverdue && !l.isOverdue) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = l.name.toLowerCase().includes(term);
        const matchPhone = l.phone.includes(term);
        const matchCompany = (l.companyName || '').toLowerCase().includes(term);
        const matchCampaign = (l.campaignName || '').toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchCompany && !matchCampaign) {
          return false;
        }
      }
      return true;
    });
  }, [leads, selectedTLMK, filterOverdue, searchTerm]);

  // Actions
  const handleMoveStatus = async (leadId: string, direction: 'prev' | 'next') => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const currentIdx = PIPELINE_COLUMNS.findIndex(c => c.id === lead.pipelineStage);
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx < 0 || newIdx >= PIPELINE_COLUMNS.length) return;

    const newStage = PIPELINE_COLUMNS[newIdx].id;

    // Confetti if won
    if (newStage === 'CIERRE') {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipelineStage: newStage } : l));

    try {
      const leadRef = doc(db, 'clients', leadId);
      await updateDoc(leadRef, {
        pipelineStage: newStage,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Local update kept:", e);
    }
  };

  const handleReassignTLMK = async (leadId: string, newTLMK: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedTLMK: newTLMK } : l));
    try {
      const leadRef = doc(db, 'clients', leadId);
      await updateDoc(leadRef, {
        assignedTLMK: newTLMK,
        setterName: newTLMK,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Local reassign kept:", e);
    }
  };

  const handleCreateManualLead = async (newLead: Partial<LeadOpportunity>) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...newLead,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setLeads(prev => [{ ...newLead, id: docRef.id } as LeadOpportunity, ...prev]);
    } catch (e) {
      const tempId = `lead_${Date.now()}`;
      setLeads(prev => [{ ...newLead, id: tempId } as LeadOpportunity, ...prev]);
    }
  };

  const handleImportLeads = async (importedLeads: Partial<LeadOpportunity>[]) => {
    const enriched = importedLeads.map((lead, idx) => ({
      ...lead,
      id: `imp_${Date.now()}_${idx}`
    } as LeadOpportunity));

    setLeads(prev => [...enriched, ...prev]);

    // Save batch to Firestore
    try {
      for (const lead of importedLeads) {
        await addDoc(collection(db, 'clients'), {
          ...lead,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.warn("Batch saved locally:", e);
    }
  };

  const handleSaveLeadHeader = async (leadId: string, updatedData: Partial<LeadOpportunity>) => {
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      ...updatedData,
      updatedAt: new Date().toISOString()
    } : l));

    try {
      const leadRef = doc(db, 'clients', leadId);
      await updateDoc(leadRef, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Error updating lead header in Firestore:", err);
    }
  };

  const handleSaveAppointment = async (clientId: string, appointment: AppointmentData) => {
    setLeads(prev => prev.map(l => l.id === clientId ? {
      ...l,
      pipelineStage: 'CITA_AGENDADA',
      appointment,
      notes: [
        {
          id: `app_note_${Date.now()}`,
          author: appointment.assignedAgent,
          text: `Cita agendada para el ${appointment.date} a las ${appointment.time}. Modalidad: ${appointment.type}. Guardada en Agenda & Reuniones de la app.`,
          createdAt: new Date().toISOString(),
          disposition: 'CITA_AGENDADA'
        },
        ...(l.notes || [])
      ]
    } : l));

    try {
      const leadRef = doc(db, 'clients', clientId);
      await updateDoc(leadRef, {
        pipelineStage: 'CITA_AGENDADA',
        appointment,
        updatedAt: new Date().toISOString()
      });

      // Sincronizar directamente en la colección appointments para Agenda & Reuniones
      const targetLead = leads.find(l => l.id === clientId);
      const appDocRef = doc(db, 'appointments', `app_${clientId}`);
      await setDoc(appDocRef, {
        id: `app_${clientId}`,
        clientId,
        clientName: targetLead?.name || 'Cliente Oportunidad',
        clientPhone: targetLead?.phone || '',
        clientCompany: targetLead?.companyName || targetLead?.company || '',
        title: `Cita Comercial: ${targetLead?.name || 'Cliente'} (${appointment.type})`,
        date: appointment.date,
        time: appointment.time,
        assignedAgent: appointment.assignedAgent,
        type: appointment.type,
        address: appointment.address || '',
        direction: appointment.direction || '',
        formattedAddress: appointment.formattedAddress || '',
        notes: appointment.notes || '',
        status: 'programada',
        gpsCoordinates: appointment.gpsCoordinates || null,
        gpsVerified: Boolean(appointment.gpsVerified),
        source: 'marketing_pipeline',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveGpsFeedback = async (clientId: string, updatedAppointment: AppointmentData) => {
    setLeads(prev => prev.map(l => l.id === clientId ? {
      ...l,
      pipelineStage: 'CITA_CUMPLIDA',
      appointment: updatedAppointment,
      notes: [
        {
          id: `gps_note_${Date.now()}`,
          author: updatedAppointment.assignedAgent,
          text: `Cita Cumplida y Verificada por GPS (${updatedAppointment.gpsCoordinates?.lat}, ${updatedAppointment.gpsCoordinates?.lng}). Feedback: "${updatedAppointment.clientFeedback?.comment}"`,
          createdAt: new Date().toISOString()
        },
        ...(l.notes || [])
      ]
    } : l));

    try {
      const leadRef = doc(db, 'clients', clientId);
      await updateDoc(leadRef, {
        pipelineStage: 'CITA_CUMPLIDA',
        appointment: updatedAppointment,
        updatedAt: new Date().toISOString()
      });

      // Actualizar estado en appointments
      const appDocRef = doc(db, 'appointments', `app_${clientId}`);
      await setDoc(appDocRef, {
        status: 'cumplida',
        gpsVerified: true,
        gpsCoordinates: updatedAppointment.gpsCoordinates || null,
        clientFeedback: updatedAppointment.clientFeedback || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddNote = async (clientId: string, noteText: string) => {
    const newNote = {
      id: `note_${Date.now()}`,
      author: selectedTLMK !== 'all' ? selectedTLMK : 'Zaydeli De La Rosa',
      text: noteText,
      createdAt: new Date().toISOString()
    };

    setLeads(prev => prev.map(l => l.id === clientId ? {
      ...l,
      notes: [newNote, ...(l.notes || [])]
    } : l));

    try {
      const lead = leads.find(l => l.id === clientId);
      if (lead) {
        const leadRef = doc(db, 'clients', clientId);
        await updateDoc(leadRef, {
          notes: [newNote, ...(lead.notes || [])],
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCall = (phoneNumber: string) => {
    // Navigate to CallSystem with pre-dialed number
    navigate(`/crm/calls?dial=${encodeURIComponent(phoneNumber)}`);
  };

  const handleWhatsApp = async (phoneNumber: string, contactName: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const messageText = `Hola ${contactName}, te escribo del equipo de Kaivincia Corp respecto a tu solicitud de información.`;
    const opName = selectedTLMK !== 'all' ? selectedTLMK : (currentUser?.displayName || 'Marta García');

    // Sincronizar en la bandeja unificada de WhatsApp multi-agente
    try {
      const threadId = 'wa_' + cleanNumber;
      await setDoc(doc(db, 'shared_whatsapp_chats', threadId), {
        id: threadId,
        clientName: contactName,
        clientPhone: phoneNumber,
        company: 'Lead Pipeline',
        lastMessage: messageText,
        lastMessageTime: 'Ahora',
        assignedOperator: opName,
        unreadCount: 0,
        status: 'open',
        messages: [
          {
            id: 'm_' + Date.now(),
            sender: 'operator',
            operatorName: opName,
            text: messageText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
          }
        ]
      }, { merge: true });
    } catch (e) {
      console.warn('Could not sync to shared whatsapp:', e);
    }

    const message = encodeURIComponent(messageText);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragStartEvent) => {
    setDraggedLead(e.active.data.current as LeadOpportunity);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setDraggedLead(null);
    if (!over) return;

    const leadId = active.id as string;
    const targetStage = over.id as PipelineStage;

    if (draggedLead && draggedLead.pipelineStage !== targetStage) {
      if (targetStage === 'CIERRE') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }

      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipelineStage: targetStage } : l));

      try {
        const leadRef = doc(db, 'clients', leadId);
        await updateDoc(leadRef, {
          pipelineStage: targetStage,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Metrics
  const totalCount = leads.length;
  const overdueCount = leads.filter(l => l.isOverdue).length;
  const appointmentsCount = leads.filter(l => l.appointment?.status === 'programada').length;
  const wonCount = leads.filter(l => l.pipelineStage === 'CIERRE').length;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Top Header & Filters */}
      <div className="bg-[#0A0D14] border border-slate-800/80 rounded-3xl p-5 shadow-xl shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Megaphone className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">
                Marketing <span className="text-cyan-400 text-sm font-normal not-italic tracking-normal">| Oportunidades & Citas</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Meta Ads & TLMK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Captación de prospectos de campañas publicitarias, agendamiento sincronizado con Google Calendar, ubicación GPS y discador VoIP directo.
            </p>
          </div>

          {/* Quick Action Buttons & View Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle (Kanban vs Lista) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-cyan-500 text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en Tablero Kanban"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-cyan-500 text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en Lista Detallada"
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Icon / Card Size Selector (Iconos más grande / más pequeño) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 gap-0.5" title="Tamaño de iconos y fichas">
              <span className="text-[9px] font-black uppercase px-2 text-slate-500">Tamaño:</span>
              <button
                onClick={() => setCardSize('sm')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  cardSize === 'sm' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Iconos y fichas más pequeñas"
              >
                S
              </button>
              <button
                onClick={() => setCardSize('md')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  cardSize === 'md' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Iconos y fichas medianas"
              >
                M
              </button>
              <button
                onClick={() => setCardSize('lg')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  cardSize === 'lg' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Iconos y fichas más grandes"
              >
                L
              </button>
            </div>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Contacto</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-blue-400" />
              <span>Importar Meta</span>
            </button>
          </div>
        </div>

        {/* Metrics & Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o campaña..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
              />
            </div>

            {/* TLMK Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500">Agente:</span>
              <select
                value={selectedTLMK}
                onChange={(e) => setSelectedTLMK(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#00F0FF] font-bold"
              >
                <option value="all">Todos los TLMK ({totalCount})</option>
                {TLMK_AGENTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Overdue filter pill */}
            <button
              onClick={() => setFilterOverdue(!filterOverdue)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                filterOverdue 
                  ? 'bg-red-500 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Solo Atrasados ({overdueCount})</span>
            </button>
          </div>

          {/* Metric Badges */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Total: <strong className="text-white">{filteredLeads.length}</strong>
            </span>
            <span className="text-purple-400">
              Citas: <strong className="text-white">{appointmentsCount}</strong>
            </span>
            <span className="text-emerald-400">
              Ganados: <strong className="text-white">{wonCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or List View */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <PipelineListView
            leads={filteredLeads}
            pipelineColumns={PIPELINE_COLUMNS}
            onMove={handleMoveStatus}
            onOpenAppointment={(lead: LeadOpportunity) => setActiveAppointmentLead(lead)}
            onOpenGps={(lead: LeadOpportunity) => setActiveGpsLead(lead)}
            onOpenNotes={(lead: LeadOpportunity) => setActiveNotesLead(lead)}
            onReassignTLMK={handleReassignTLMK}
            onCall={handleCall}
            onWhatsApp={handleWhatsApp}
            onSaveLeadHeader={handleSaveLeadHeader}
            tlmkList={TLMK_AGENTS}
            size={cardSize}
          />
        </div>
      ) : (
        /* Kanban Board with Drag & Drop */
        <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max h-full">
              {PIPELINE_COLUMNS.map((column) => {
                const colLeads = filteredLeads.filter(l => l.pipelineStage === column.id);
                return (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    leads={colLeads}
                    onMove={handleMoveStatus}
                    onOpenAppointment={(lead: LeadOpportunity) => setActiveAppointmentLead(lead)}
                    onOpenGps={(lead: LeadOpportunity) => setActiveGpsLead(lead)}
                    onOpenNotes={(lead: LeadOpportunity) => setActiveNotesLead(lead)}
                    onReassignTLMK={handleReassignTLMK}
                    onCall={handleCall}
                    onWhatsApp={handleWhatsApp}
                    tlmkList={TLMK_AGENTS}
                    openAbatibleId={openAbatibleId}
                    setOpenAbatibleId={setOpenAbatibleId}
                    onSaveLeadHeader={handleSaveLeadHeader}
                    size={cardSize}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {draggedLead ? (
                <div className="w-80 opacity-90 rotate-2 shadow-2xl scale-105 pointer-events-none">
                  <KanbanCard
                    lead={draggedLead}
                    onMove={() => {}}
                    onOpenAppointment={() => {}}
                    onOpenGps={() => {}}
                    onOpenNotes={() => {}}
                    onReassignTLMK={() => {}}
                    onCall={() => {}}
                    onWhatsApp={() => {}}
                    tlmkList={TLMK_AGENTS}
                    size={cardSize}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Modals */}
      <ManualContactModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleCreateManualLead}
        tlmkList={TLMK_AGENTS}
      />

      <MetaImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportLeads}
        tlmkList={TLMK_AGENTS}
      />

      <AppointmentModal
        isOpen={Boolean(activeAppointmentLead)}
        onClose={() => setActiveAppointmentLead(null)}
        client={activeAppointmentLead}
        onSaveAppointment={handleSaveAppointment}
        agentsList={['Supervisor Comercial', ...TLMK_AGENTS]}
      />

      <GpsFeedbackModal
        isOpen={Boolean(activeGpsLead)}
        onClose={() => setActiveGpsLead(null)}
        client={activeGpsLead}
        onSaveFeedback={handleSaveGpsFeedback}
      />

      <LeadNotesModal
        isOpen={Boolean(activeNotesLead)}
        onClose={() => setActiveNotesLead(null)}
        client={activeNotesLead}
        onAddNote={handleAddNote}
        currentUserName={selectedTLMK !== 'all' ? selectedTLMK : 'Zaydeli De La Rosa'}
      />
    </div>
  );
}
