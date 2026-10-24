import React, { useState } from 'react';
import { X, UserPlus, Phone, Building, Mail, Megaphone, User, Tag } from 'lucide-react';
import { LeadOpportunity, PipelineStage } from '../../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<LeadOpportunity>) => Promise<void>;
  tlmkList: string[];
}

export default function ManualContactModal({ isOpen, onClose, onSave, tlmkList }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [campaignName, setCampaignName] = useState('Campaña Meta Ads Q1');
  const [assignedTLMK, setAssignedTLMK] = useState(tlmkList[0] || 'Zaydeli De La Rosa');
  const [stage, setStage] = useState<PipelineStage>('LEAD_IN');
  const [initialNote, setInitialNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        companyName: companyName.trim() || undefined,
        source: 'manual',
        campaignName: campaignName.trim(),
        pipelineStage: stage,
        assignedTLMK: assignedTLMK,
        contractValue: 0,
        healthScore: 100,
        notes: initialNote.trim() ? [{
          id: `note_${Date.now()}`,
          author: assignedTLMK,
          text: initialNote.trim(),
          createdAt: new Date().toISOString()
        }] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      onClose();
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setCompanyName('');
      setInitialNote('');
    } catch (err) {
      console.error("Error creating contact:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Agregar Contacto Manual</h3>
              <p className="text-[10px] text-slate-400 font-mono">Nuevo lead para telemarketing</p>
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
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Roberto Gómez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Teléfono de Contacto *
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+1 (213) 555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Empresa / Negocio
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej: Inversiones Global"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                TLMK / Asignado a
              </label>
              <select
                value={assignedTLMK}
                onChange={(e) => setAssignedTLMK(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
              >
                {tlmkList.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Campaña / Origen
              </label>
              <div className="relative">
                <Megaphone className="w-3.5 h-3.5 text-blue-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Meta Ads / Facebook / Manual"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Etapa Inicial del Embudo
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as PipelineStage)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="LEAD_IN">Nuevos Leads (Meta Ads)</option>
              <option value="CONTACTADO">Contactado (En Marcación)</option>
              <option value="SEGUIMIENTO">En Seguimiento / Reprogramado</option>
              <option value="CITA_AGENDADA">Cita Agendada</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Nota o Contexto de Inicio
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Mostró interés en la campaña de Facebook sobre servicios corporativos..."
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
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
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
