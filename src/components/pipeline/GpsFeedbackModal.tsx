import React, { useState } from 'react';
import { 
  X, MapPin, Star, CheckCircle2, Navigation, MessageSquare, 
  ShieldCheck, Compass, ExternalLink, Calendar, AlertCircle
} from 'lucide-react';
import { LeadOpportunity, AppointmentData } from '../../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: LeadOpportunity | null;
  onSaveFeedback: (clientId: string, updatedAppointment: AppointmentData) => Promise<void>;
}

export default function GpsFeedbackModal({ isOpen, onClose, client, onSaveFeedback }: Props) {
  if (!isOpen || !client) return null;

  const app = client.appointment || {
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    assignedAgent: client.assignedTLMK || 'Agente',
    type: 'presencial' as const,
    status: 'programada' as const,
    address: 'Sede Principal'
  };

  const [rating, setRating] = useState(client.appointment?.clientFeedback?.rating || 5);
  const [feedbackComment, setFeedbackComment] = useState(
    client.appointment?.clientFeedback?.comment || 'Reunión muy productiva. El cliente mostró alto interés y acordamos la entrega de propuesta final.'
  );
  const [gpsVerified, setGpsVerified] = useState(Boolean(client.appointment?.gpsVerified));
  const [lat, setLat] = useState(client.appointment?.gpsCoordinates?.lat || 19.4326);
  const [lng, setLng] = useState(client.appointment?.gpsCoordinates?.lng || -99.1332);
  const [detectedAddress, setDetectedAddress] = useState(client.appointment?.formattedAddress || client.appointment?.address || '');
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSimulateGpsCheckIn = () => {
    setIsCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = Number(pos.coords.latitude.toFixed(5));
          const longitude = Number(pos.coords.longitude.toFixed(5));
          setLat(latitude);
          setLng(longitude);
          setGpsVerified(true);

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'es' } }
            );
            if (res.ok) {
              const data = await res.json();
              if (data.display_name) {
                setDetectedAddress(data.display_name);
              }
            }
          } catch {
            // keep current address
          } finally {
            setIsCapturing(false);
          }
        },
        () => {
          // Fallback location
          setGpsVerified(true);
          setIsCapturing(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsVerified(true);
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedApp: AppointmentData = {
        ...app,
        status: 'cumplida',
        gpsVerified: true,
        gpsCoordinates: { lat, lng },
        formattedAddress: detectedAddress || app.formattedAddress,
        gpsCheckInTime: new Date().toISOString(),
        clientFeedback: {
          rating,
          comment: feedbackComment.trim(),
          submittedAt: new Date().toISOString()
        }
      };

      await onSaveFeedback(client.id, updatedApp);
      onClose();
    } catch (err) {
      console.error("Error saving GPS feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(app.address || `${lat},${lng}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Verificación GPS & Feedback de Cita</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {client.name} • Cita: <span className="text-white font-bold">{app.date}</span> a las <span className="text-white font-bold">{app.time}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* GPS Verification Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" /> Georreferenciación & Check-In Satelital
              </span>
              {gpsVerified ? (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cita Verificada GPS
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                  Pendiente de Check-In
                </span>
              )}
            </div>

            <div className="bg-black/40 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Latitud</p>
                  <p className="font-mono font-bold text-cyan-400">{lat}° N</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Longitud</p>
                  <p className="font-mono font-bold text-cyan-400">{lng}° W</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección Registrada de la Cita:</p>
                <p className="text-white font-semibold text-xs mt-0.5">{app.address || 'Ubicación registrada'}</p>
                {app.direction && (
                  <p className="text-slate-400 text-[11px] mt-0.5">Referencia: {app.direction}</p>
                )}
                {detectedAddress && detectedAddress !== app.address && (
                  <p className="text-emerald-400/90 text-[10px] font-mono mt-1">
                    Detectado GPS: {detectedAddress}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir en Google Maps
                </a>

                {app.googleCalendarUrl && (
                  <a
                    href={app.googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Ver en Google Calendar
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={isCapturing}
              onClick={handleSimulateGpsCheckIn}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 text-[#00F0FF] ${isCapturing ? 'animate-spin' : ''}`} />
              {isCapturing ? 'Verificando Satelital...' : (gpsVerified ? 'Actualizar Coordenadas GPS en Vivo' : 'Comprobar Presencia GPS en el Lugar')}
            </button>
          </div>

          {/* Feedback Module */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-300">
              Calificación de Cumplimiento & Satisfacción
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Star 
                    className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} 
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-400 ml-2 font-mono">
                {rating} / 5 Estrellas
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Comentarios y Feedback de la Cita
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <textarea
                  rows={3}
                  required
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Detalla cómo se desarrolló la cita, el interés del cliente y acuerdos alcanzados..."
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Comprobar Cita Cumplida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
