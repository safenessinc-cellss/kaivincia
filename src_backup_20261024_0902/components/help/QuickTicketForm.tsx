import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { createTicket } from '../../services/helpdeskService';

interface QuickTicketFormProps {
  onSuccess: (ticketId: string) => void;
  onCancel: () => void;
}

export default function QuickTicketForm({ onSuccess, onCancel }: QuickTicketFormProps) {
  const { t } = useLanguage();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError(t('helpdesk.validation_required', 'Por favor completa todos los campos requeridos.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ticketId = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority
      });
      setToastMessage(t('helpdesk.ticket_created', 'Ticket creado exitosamente.'));
      setTimeout(() => {
        onSuccess(ticketId);
      }, 1000);
    } catch (err: any) {
      console.error('Error al crear ticket:', err);
      setError(err?.message || t('common.error', 'Ocurrió un error al crear el ticket.'));
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/20 shadow-xl relative backdrop-blur-md">
      {/* Toast de confirmación */}
      {toastMessage && (
        <div className="absolute top-3 left-3 right-3 z-30 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header del formulario */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">
            {t('helpdesk.new_ticket_from_drawer', 'Crear Nuevo Ticket')}
          </h4>
          <p className="text-[11px] text-slate-400">
            {t('helpdesk.subtitle', 'Soporte técnico y requerimientos operativos')}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title={t('helpdesk.cancel_btn', 'Cancelar')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Asunto */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            {t('helpdesk.subject_label', 'Asunto')} <span className="text-cyan-400">*</span>
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('helpdesk.search_placeholder', 'Ej: Problema al conectar softphone...')}
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
          />
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            {t('helpdesk.priority_label', 'Prioridad')}
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
          >
            <option value="low">{t('helpdesk.priority_low', 'Baja')}</option>
            <option value="medium">{t('helpdesk.priority_medium', 'Media')}</option>
            <option value="high">{t('helpdesk.priority_high', 'Alta')}</option>
            <option value="critical">{t('helpdesk.priority_critical', 'Crítica')}</option>
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
            {t('helpdesk.description_label', 'Descripción')} <span className="text-cyan-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('helpdesk.reply_placeholder', 'Describe la incidencia, pasos para reproducir o necesidad...')}
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 resize-none transition-all"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {t('helpdesk.cancel_btn', 'Cancelar')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('common.saving', 'Creando...')}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{t('helpdesk.create_btn', 'Crear Ticket')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
