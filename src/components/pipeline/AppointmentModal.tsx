import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Calendar, Clock, User, Video, MapPin, CheckCircle, FileText, 
  ExternalLink, Navigation, Compass, AlertCircle, Sparkles, Check, ChevronDown
} from 'lucide-react';
import { AppointmentData, LeadOpportunity } from '../../types/crm';
import { buildGoogleCalendarUrl } from '../../utils/googleCalendar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: LeadOpportunity | null;
  onSaveAppointment: (clientId: string, appointment: AppointmentData) => Promise<void>;
  agentsList: string[];
}

export default function AppointmentModal({ isOpen, onClose, client, onSaveAppointment, agentsList }: Props) {
  const navigate = useNavigate();
  if (!isOpen || !client) return null;

  const existingApp = client.appointment;
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];

  const [date, setDate] = useState(existingApp?.date || tomorrow);
  const [time, setTime] = useState(existingApp?.time || '10:00');
  const [assignedAgent, setAssignedAgent] = useState(existingApp?.assignedAgent || agentsList[0] || 'Supervisor Comercial');
  const [type, setType] = useState<'presencial' | 'videollamada' | 'telefonica'>(existingApp?.type || 'presencial');
  const [address, setAddress] = useState(existingApp?.address || '');
  const [direction, setDirection] = useState(existingApp?.direction || '');
  const [notes, setNotes] = useState(existingApp?.notes || 'Demostración de propuesta, presentación de catálogo y plan de cierre.');
  const [syncInternalAgenda, setSyncInternalAgenda] = useState(true);
  const [showExternalExport, setShowExternalExport] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | undefined>(
    existingApp?.gpsCoordinates
  );
  const [formattedAddress, setFormattedAddress] = useState(existingApp?.formattedAddress || '');
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Capture GPS coordinates and reverse geocode
  const handleCaptureGps = () => {
    setIsCapturingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocalización no soportada en este navegador.');
      setIsCapturingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(5));
        const lng = Number(position.coords.longitude.toFixed(5));
        setGpsCoordinates({ lat, lng });

        try {
          // Reverse geocode via Nominatim (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'es'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            const displayName = data.display_name || '';
            setFormattedAddress(displayName);
            if (!address || address === 'Google Meet / Zoom Virtual') {
              setAddress(displayName);
            }
            if (!direction) {
              const road = data.address?.road || '';
              const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city || '';
              setDirection(`${road} ${suburb}`.trim());
            }
          }
        } catch {
          // Fallback if reverse geocode service is unreachable
          const fallbackLocation = `Lat: ${lat}, Lng: ${lng}`;
          setFormattedAddress(fallbackLocation);
          if (!address) setAddress(fallbackLocation);
        } finally {
          setIsCapturingGps(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('No se pudo obtener el GPS. Puedes ingresar la dirección manualmente.');
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getCalendarUrl = () => {
    const title = `Cita Comercial: ${client.name} (${client.companyName || client.company || 'Oportunidad'})`;
    const loc = type === 'presencial' 
      ? (direction ? `${direction} - ${address}` : (address || (gpsCoordinates ? `GPS: ${gpsCoordinates.lat}, ${gpsCoordinates.lng}` : 'Dirección por definir')))
      : (address || 'Google Meet');
    
    const desc = `Prospecto: ${client.name}\nTeléfono: ${client.phone}\nEmpresa: ${client.companyName || client.company || 'N/A'}\nCerrador Asignado: ${assignedAgent}\nModalidad: ${type}\nDirección / GPS: ${loc}\n\nNotas:\n${notes}\n\nAgendado desde CRM Kaivincia Marketing.`;

    return buildGoogleCalendarUrl({
      title,
      date,
      time,
      durationMinutes: 60,
      description: desc,
      location: loc
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const gCalUrl = getCalendarUrl();

      const appData: AppointmentData = {
        date,
        time,
        assignedAgent,
        type,
        address: address || (type === 'videollamada' ? 'Google Meet Virtual' : (type === 'telefonica' ? 'Llamada VoIP' : 'Oficina / Sede')),
        direction: direction || undefined,
        formattedAddress: formattedAddress || undefined,
        notes,
        status: 'programada',
        googleCalendarUrl: gCalUrl,
        gpsVerified: Boolean(gpsCoordinates),
        gpsCoordinates: gpsCoordinates || undefined,
        gpsCheckInTime: gpsCoordinates ? new Date().toISOString() : undefined
      };

      await onSaveAppointment(client.id, appData);
      setScheduledSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Error saving appointment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00F0FF]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Ficha de Agendamiento • Agenda & Reuniones</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Agenda Interna CRM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {client.name} • <span className="text-emerald-400 font-bold">{client.phone}</span>
                {client.companyName && <span className="text-slate-500"> • {client.companyName}</span>}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Success Notification */}
        {scheduledSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">¡Cita agendada con éxito en la Agenda de la App!</p>
                <p className="text-[10px] text-emerald-300/80">Quedó registrada en la Agenda & Reuniones interna.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/crm/calendar');
              }}
              className="px-2.5 py-1 bg-emerald-500 text-black text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-400 transition-all"
            >
              Ver en Agenda
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Banner explicativo Agenda Interna */}
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-white">Agendar en la Agenda & Reuniones de la App</p>
              <p className="text-[11px] text-cyan-200/80 leading-relaxed mt-0.5">
                Esta reunión quedará registrada en el sistema de <strong>Agenda y Reuniones</strong> del CRM, asignada al consultor cerrador y con geolocalización GPS disponible en tiempo real.
              </p>
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Fecha de la Cita *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Hora de la Cita *
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>
          </div>

          {/* Asignación y Modalidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Asignar Consultor / Closer
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <select
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] font-bold"
                >
                  {agentsList.map(a => (
                    <option key={a} value={a} className="bg-slate-900 text-white">{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Modalidad de la Cita
              </label>
              <div className="relative">
                <Video className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="presencial">Presencial (Sede / Dirección Física)</option>
                  <option value="videollamada">Videollamada (Meet / Zoom Virtual)</option>
                  <option value="telefonica">Llamada Telefónica / VoIP</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN GPS Y DIRECCIÓN DONDE FUE AGENDADO */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  {type === 'presencial' ? 'Dirección & Ubicación GPS Agendada' : (type === 'telefonica' ? 'Contacto Telefónico' : 'Enlace / Plataforma Virtual')}
                </span>
              </div>

              {type === 'presencial' && (
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={isCapturingGps}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
                  <span>{isCapturingGps ? 'Detectando GPS...' : 'Capturar GPS Actual'}</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {type === 'presencial' ? 'Dirección o Referencia *' : (type === 'telefonica' ? 'Teléfono de Contacto' : 'Sala Virtual / Enlace de Videollamada')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={type === 'presencial' ? 'Ej: Av. Principal 123, Torre Empresarial Piso 4' : (type === 'telefonica' ? client.phone : 'https://meet.google.com/abc-def-ghi')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {type === 'presencial' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Punto de Referencia / Detalles de Acceso
                  </label>
                  <input
                    type="text"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    placeholder="Ej: Frente al centro comercial, timbre comercial 401..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* GPS Coordinates & Map Link Badge */}
            {gpsCoordinates && type === 'presencial' && (
              <div className="bg-black/50 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 block">
                      GPS Detectado: {gpsCoordinates.lat}°, {gpsCoordinates.lng}°
                    </span>
                    {formattedAddress && (
                      <span className="text-[10px] text-slate-400 truncate max-w-sm block">
                        {formattedAddress}
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${gpsCoordinates.lat},${gpsCoordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  <ExternalLink className="w-3 h-3" /> Ver en Mapa
                </a>
              </div>
            )}

            {gpsError && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {gpsError}
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Notas y Requerimientos de la Cita
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Objetivos de la sesión, dudas del cliente..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          {/* CONFIGURACIÓN DE AGENDAMIENTO INTERNO */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">Sincronizar en Agenda & Reuniones de la App</p>
                <p className="text-[10px] text-slate-400">
                  Visible inmediatamente en el módulo /crm/calendar con alerta para el equipo.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={syncInternalAgenda}
                onChange={(e) => setSyncInternalAgenda(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* OPCIÓN SECUNDARIA: EXPORTACIÓN EXTERNA OPCIONAL */}
          <div className="border border-slate-800 rounded-xl p-2.5 bg-slate-950/60">
            <button
              type="button"
              onClick={() => setShowExternalExport(!showExternalExport)}
              className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3 text-slate-500" />
                Opciones avanzadas: Enlace externo Google Calendar (Opcional)
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showExternalExport ? 'rotate-180' : ''}`} />
            </button>

            {showExternalExport && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500">
                  Si deseas generar también un enlace web externo de Google Calendar para el cliente o tu calendario personal:
                </p>
                <a
                  href={getCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold shrink-0 flex items-center gap-1 transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> Abrir enlace externo
                </a>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/crm/calendar');
              }}
              className="px-3 py-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Abrir Agenda & Reuniones
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-cyan-400 rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? 'Guardando en Agenda...' : 'Agendar en Agenda & Reuniones'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
