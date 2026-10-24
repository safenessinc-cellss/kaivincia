import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Pause, 
  User, 
  Calendar, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  FileSpreadsheet, 
  FileText, 
  Volume2, 
  X,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { CallRecord } from '../../types/calls';

interface CallHistoryTableProps {
  onSelectCall?: (call: CallRecord) => void;
  onTriggerCall?: (phoneNumber: string) => void;
  className?: string;
}

export default function CallHistoryTable({ onSelectCall, onTriggerCall, className = '' }: CallHistoryTableProps) {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Reproductor de audio local
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal de detalle de llamada
  const [selectedCallDetail, setSelectedCallDetail] = useState<CallRecord | null>(null);

  // Suscripción en tiempo real a `voip_call_history`
  useEffect(() => {
    if (authLoading || !user) return;

    setLoading(true);
    const q = query(collection(db, 'voip_call_history'), orderBy('startedAt', 'desc'), limit(200));

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const records: CallRecord[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            agentId: d.agentId || 'agent_1',
            agentName: d.agentName || d.agent || 'Agente Kaivincia',
            agentEmail: d.agentEmail || 'agent@kaivincia.com',
            contactId: d.contactId || d.clientId || '',
            contactName: d.contactName || d.name || d.target || d.number || 'Contacto Desconocido',
            contactPhone: d.contactPhone || d.number || '',
            direction: d.direction || 'outbound',
            status: d.status === 'completed' || d.status === 'Success' ? 'completed' : (d.status || 'missed'),
            duration: typeof d.duration === 'number' ? d.duration : parseDurationStringToSec(d.duration),
            durationFormatted: typeof d.duration === 'string' ? d.duration : formatSecToDuration(d.duration || 0),
            startedAt: d.startedAt || d.timestamp || d.date || new Date().toISOString(),
            endedAt: d.endedAt,
            recordingUrl: d.recordingUrl || d.audioUrl || '',
            provider: d.provider || 'Zadarma',
            carrier: d.carrier || 'zadarma',
            notes: d.notes || '',
            sentiment: d.sentiment || 'neutral',
            cost: d.cost
          } as CallRecord;
        });
        setCalls(records);
      } else {
        // Mock inicial seguro si la colección está vacía
        setCalls([
          {
            id: 'call_demo_1',
            agentId: 'ag_1',
            agentName: 'Marta García',
            agentEmail: 'marta@kaivincia.com',
            contactId: 'lead_101',
            contactName: 'Juan Pérez (CEO)',
            contactPhone: '+1 (323) 555-0199',
            direction: 'outbound',
            status: 'completed',
            duration: 165,
            durationFormatted: '02:45',
            startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            recordingUrl: 'https://actions.google.com/sounds/v1/ambiences/office_murmur.ogg',
            provider: 'Zadarma',
            sentiment: 'positive',
            notes: 'Interesado en licenciamiento corporativo.'
          },
          {
            id: 'call_demo_2',
            agentId: 'ag_2',
            agentName: 'Carlos Ruiz',
            agentEmail: 'carlos@kaivincia.com',
            contactId: 'lead_102',
            contactName: 'TechSolutions Inc.',
            contactPhone: '+34 912 345 678',
            direction: 'inbound',
            status: 'completed',
            duration: 730,
            durationFormatted: '12:10',
            startedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            provider: 'Zoho Voice',
            sentiment: 'neutral',
            notes: 'Consulta técnica sobre integración SIP.'
          },
          {
            id: 'call_demo_3',
            agentId: 'ag_3',
            agentName: 'Ana Silva',
            agentEmail: 'ana@kaivincia.com',
            contactId: '',
            contactName: 'Miguel Rojas',
            contactPhone: '+54 9 11 9876 5432',
            direction: 'outbound',
            status: 'missed',
            duration: 0,
            durationFormatted: '00:00',
            startedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
            provider: 'Twilio',
            sentiment: 'negative',
            notes: 'No contestó llamada tras 4 repiques.'
          }
        ]);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Error reading voip_call_history:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  // Utilidad para parsear string mm:ss a segundos
  function parseDurationStringToSec(dur: any): number {
    if (!dur) return 0;
    if (typeof dur === 'number') return dur;
    const parts = dur.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 0;
  }

  function formatSecToDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Lista única de agentes para el filtro
  const agentsList = useMemo(() => {
    const set = new Set<string>();
    calls.forEach(c => {
      if (c.agentName) set.add(c.agentName);
    });
    return Array.from(set);
  }, [calls]);

  // Filtrado de llamadas
  const filteredCalls = useMemo(() => {
    return calls.filter(c => {
      // Filtro de búsqueda texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = c.contactName?.toLowerCase().includes(term);
        const matchPhone = c.contactPhone?.toLowerCase().includes(term);
        const matchAgent = c.agentName?.toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchAgent) return false;
      }

      // Filtro de agente
      if (filterAgent !== 'all' && c.agentName !== filterAgent) {
        return false;
      }

      // Filtro de resultado / status
      if (filterStatus !== 'all' && c.status !== filterStatus) {
        return false;
      }

      // Filtro de rango de fecha
      if (filterDateRange !== 'all') {
        const callDate = new Date(c.startedAt).getTime();
        const now = Date.now();
        if (filterDateRange === 'today' && now - callDate > 86400000) return false;
        if (filterDateRange === 'week' && now - callDate > 86400000 * 7) return false;
        if (filterDateRange === 'month' && now - callDate > 86400000 * 30) return false;
      }

      return true;
    });
  }, [calls, searchTerm, filterAgent, filterStatus, filterDateRange]);

  // Manejador del reproductor de audio
  const handlePlayAudio = (callId: string, url: string) => {
    if (playingAudioId === callId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (!url) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudioId(callId);
    setAudioProgress(0);

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setPlayingAudioId(null);
      setAudioProgress(0);
    };

    audio.play().catch(e => {
      console.warn('Audio playback error:', e);
      setPlayingAudioId(null);
    });
  };

  // Limpieza del audio al desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Exportar a Excel (.xlsx)
  const handleExportExcel = () => {
    const exportData = filteredCalls.map(c => ({
      Fecha: new Date(c.startedAt).toLocaleString(),
      Agente: c.agentName || 'N/A',
      Contacto: c.contactName,
      Telefono: c.contactPhone,
      Sentido: c.direction === 'inbound' ? 'Entrante' : 'Saliente',
      Estado: c.status === 'completed' ? 'Completada' : 'Perdida/Rechazada',
      Duracion_Seg: c.duration,
      Duracion_Formato: c.durationFormatted || formatSecToDuration(c.duration),
      Proveedor: c.provider,
      Sentimiento: c.sentiment || 'N/A',
      Grabacion: c.recordingUrl ? 'Disponible' : 'Sin audio'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial_VoIP');
    XLSX.writeFile(workbook, `Kaivincia_Historial_VoIP_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Exportar a CSV
  const handleExportCsv = () => {
    const headers = ['Fecha', 'Agente', 'Contacto', 'Telefono', 'Sentido', 'Estado', 'Duracion', 'Proveedor'];
    const rows = filteredCalls.map(c => [
      `"${new Date(c.startedAt).toLocaleString()}"`,
      `"${c.agentName || ''}"`,
      `"${c.contactName || ''}"`,
      `"${c.contactPhone || ''}"`,
      `"${c.direction}"`,
      `"${c.status}"`,
      `"${c.durationFormatted || formatSecToDuration(c.duration)}"`,
      `"${c.provider || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historial_VoIP_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabecera y Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-500" />
              <span>{t('calls.history_title', 'Auditoría e Historial de Llamadas')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('calls.history_subtitle', 'Registro detallado e inmutable de interacciones VoIP, grabaciones y análisis de sentimiento.')}
            </p>
          </div>

          {/* Botones de Exportación */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={filteredCalls.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handleExportCsv}
              disabled={filteredCalls.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Búsqueda por texto */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por contacto, teléfono o agente..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filtro por Agente */}
          <div>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Todos los Agentes</option>
              {agentsList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Filtro por Estado / Resultado */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Todos los Resultados</option>
              <option value="completed">Completadas</option>
              <option value="missed">Perdidas / Sin respuesta</option>
              <option value="busy">Ocupado</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Cualquier Fecha</option>
              <option value="today">Últimas 24 horas</option>
              <option value="week">Últimos 7 días</option>
              <option value="month">Últimos 30 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Cargando bitácora de llamadas...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron llamadas</p>
            <p className="text-xs text-slate-400">Intenta ajustar los filtros de búsqueda o fecha seleccionada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Sentido / Estado</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Agente</th>
                  <th className="px-6 py-4">Contacto / Destino</th>
                  <th className="px-6 py-4">Duración</th>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4 text-center">Grabación</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredCalls.map((call) => {
                  const isCompleted = call.status === 'completed';
                  return (
                    <tr 
                      key={call.id}
                      className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Estado y Sentido */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {call.direction === 'inbound' ? (
                            <PhoneIncoming className="w-4 h-4 text-cyan-500" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {isCompleted ? 'Completada' : 'Perdida'}
                          </span>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {new Date(call.startedAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(call.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Agente */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {call.agentName}
                        </span>
                      </td>

                      {/* Contacto / Destino */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {call.contactName}
                          </span>
                          <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                            {call.contactPhone}
                          </span>
                        </div>
                      </td>

                      {/* Duración */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {call.durationFormatted || formatSecToDuration(call.duration)}
                      </td>

                      {/* Proveedor */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold">
                          {call.provider}
                        </span>
                      </td>

                      {/* Grabación de Audio */}
                      <td className="px-6 py-4 text-center">
                        {call.recordingUrl ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handlePlayAudio(call.id, call.recordingUrl!)}
                              className={`p-2 rounded-xl transition-all ${
                                playingAudioId === call.id
                                  ? 'bg-cyan-500 text-black shadow-md'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-500'
                              }`}
                              title={playingAudioId === call.id ? 'Pausar audio' : 'Reproducir grabación'}
                            >
                              {playingAudioId === call.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sin audio</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {call.contactId && (
                            <button
                              onClick={() => navigate(`/crm/clients/${call.contactId}`)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors"
                              title="Ver ficha del contacto"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCallDetail(call);
                              onSelectCall?.(call);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-[10px] font-bold transition-all"
                          >
                            Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Llamada */}
      <AnimatePresence>
        {selectedCallDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedCallDetail(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Ficha de Llamada #{selectedCallDetail.id.slice(-6)}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedCallDetail.startedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Contacto</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedCallDetail.contactName}</p>
                    <p className="font-mono text-cyan-500 text-[11px]">{selectedCallDetail.contactPhone}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Agente</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedCallDetail.agentName}</p>
                    <p className="text-slate-400 text-[11px]">{selectedCallDetail.agentEmail}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Duración</span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">{selectedCallDetail.durationFormatted || formatSecToDuration(selectedCallDetail.duration)}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Carrier</span>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedCallDetail.provider}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Sentimiento</span>
                    <p className="font-bold text-emerald-500 capitalize">{selectedCallDetail.sentiment || 'Neutro'}</p>
                  </div>
                </div>

                {selectedCallDetail.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Notas de la Conversación</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{selectedCallDetail.notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedCallDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
