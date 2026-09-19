import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, Clock, PhoneOff, AlertTriangle, FileText, UserCheck, Save } from 'lucide-react';
import { CallDisposition } from '../../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contactNumber: string;
  contactName: string;
  onSaveDisposition: (disposition: CallDisposition, note: string, appointmentDate?: string, appointmentTime?: string) => Promise<void>;
}

export default function CallDispositionModal({ isOpen, onClose, contactNumber, contactName, onSaveDisposition }: Props) {
  const [disposition, setDisposition] = useState<CallDisposition>('INTERESADO');
  const [note, setNote] = useState('');
  const [appDate, setAppDate] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [appTime, setAppTime] = useState('11:00');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSaveDisposition(
        disposition, 
        note.trim(), 
        disposition === 'CITA_AGENDADA' ? appDate : undefined, 
        disposition === 'CITA_AGENDADA' ? appTime : undefined
      );
      onClose();
    } catch (err) {
      console.error("Error saving call disposition:", err);
    } finally {
      setLoading(false);
    }
  };

  const dispositionsList: { id: CallDisposition; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'CITA_AGENDADA', label: 'Cita Agendada (Meta Lograda)', icon: Calendar, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10', desc: 'Reunión coordinada con fecha y hora.' },
    { id: 'INTERESADO', label: 'Contactado / Interesado', icon: UserCheck, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', desc: 'Habló con el asesor, en proceso de decisión.' },
    { id: 'VOLVER_A_LLAMAR', label: 'Volver a Llamar (Reprogramar)', icon: Clock, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10', desc: 'Solicitó llamada en otro momento del día.' },
    { id: 'NO_CONTESTA', label: 'No Contesta / Buzón de Voz', icon: PhoneOff, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', desc: 'Repicó pero no atendió la llamada.' },
    { id: 'NUMERO_EQUIVOCADO', label: 'Número Equivocado / Descartado', icon: AlertTriangle, color: 'text-red-400 border-red-500/40 bg-red-500/10', desc: 'Línea no existe o no tiene relación con el lead.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Disposición & Acción de la Llamada</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {contactName || 'Contacto'} • <span className="text-emerald-400 font-bold">{contactNumber}</span>
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
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Resultado de la Interacción Telefónica *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dispositionsList.map((d) => {
                const Icon = d.icon;
                const isSelected = disposition === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDisposition(d.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? `${d.color} shadow-[0_0_15px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider truncate">{d.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">{d.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Appointment Fields */}
          {disposition === 'CITA_AGENDADA' && (
            <div className="bg-purple-950/20 border border-purple-800/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Programación de la Cita
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Call Notes */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Notas de la Llamada (Se guardan en la tarjeta del lead) *
            </label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Escribe el resumen de la conversación, objeciones, temas acordados..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Omitir Registro
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-[#22D3EE] rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Guardando...' : 'Guardar Disposición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
