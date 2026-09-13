import React, { useState } from 'react';
import { X, Calendar, Clock, User, Video, MapPin, CheckCircle, FileText } from 'lucide-react';
import { AppointmentData, LeadOpportunity } from '../../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: LeadOpportunity | null;
  onSaveAppointment: (clientId: string, appointment: AppointmentData) => Promise<void>;
  agentsList: string[];
}

export default function AppointmentModal({ isOpen, onClose, client, onSaveAppointment, agentsList }: Props) {
  if (!isOpen || !client) return null;

  const existingApp = client.appointment;
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];

  const [date, setDate] = useState(existingApp?.date || tomorrow);
  const [time, setTime] = useState(existingApp?.time || '10:00');
  const [assignedAgent, setAssignedAgent] = useState(existingApp?.assignedAgent || agentsList[0] || 'Supervisor Comercial');
  const [type, setType] = useState<'presencial' | 'videollamada' | 'telefonica'>(existingApp?.type || 'videollamada');
  const [address, setAddress] = useState(existingApp?.address || 'Google Meet / Zoom Virtual');
  const [notes, setNotes] = useState(existingApp?.notes || 'Demostración de propuesta y plan de cierre.');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const appData: AppointmentData = {
        date,
        time,
        assignedAgent,
        type,
        address,
        notes,
        status: 'programada',
        gpsVerified: false
      };
      await onSaveAppointment(client.id, appData);
      onClose();
    } catch (err) {
      console.error("Error saving appointment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Agendar Cita con Cliente</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {client.name} • <span className="text-emerald-400 font-bold">{client.phone}</span>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Fecha de la Cita *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Hora de la Cita *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-3" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Asignar Consultor / Closer
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <select
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {agentsList.map(a => (
                    <option key={a} value={a} className="bg-slate-900 text-white">{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Modalidad
              </label>
              <div className="relative">
                <Video className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-3" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="videollamada">Videollamada (Meet / Zoom)</option>
                  <option value="presencial">Presencial (Sede / Oficina)</option>
                  <option value="telefonica">Llamada Telefónica</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {type === 'presencial' ? 'Dirección Física' : 'Enlace de Reunión o Teléfono'}
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={type === 'presencial' ? 'Ej: Carrera 15 # 93-60, Oficina 402' : 'https://meet.google.com/abc-def-ghi'}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Notas y Objetivos de la Cita
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Objetivos de la sesión, requerimientos previos del cliente..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
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
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-blue-400 hover:bg-blue-300 rounded-xl transition-all shadow-[0_0_15px_rgba(96,165,250,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {loading ? 'Agendando...' : 'Confirmar y Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
