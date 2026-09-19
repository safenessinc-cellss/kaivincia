import React, { useState } from 'react';
import { 
  Edit3, ChevronDown, ChevronUp, Save, X, Building2, User, Phone, 
  DollarSign, Megaphone, CheckCircle2, SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeadOpportunity, PipelineStage } from '../../types/crm';

interface Props {
  lead: LeadOpportunity;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (leadId: string, updatedData: Partial<LeadOpportunity>) => Promise<void>;
  pipelineColumns: { id: PipelineStage; label: string; color: string; badgeBg: string }[];
  tlmkList: string[];
  size?: 'sm' | 'md' | 'lg';
}

export default function CardHeaderAbatible({
  lead,
  isOpen,
  onToggle,
  onSave,
  pipelineColumns,
  tlmkList,
  size = 'md'
}: Props) {
  const [name, setName] = useState(lead.name || '');
  const [company, setCompany] = useState(lead.companyName || lead.company || '');
  const [phone, setPhone] = useState(lead.phone || '');
  const [dealValue, setDealValue] = useState<number | string>(lead.contractValue || lead.dealValue || '');
  const [campaign, setCampaign] = useState(lead.campaignName || '');
  const [stage, setStage] = useState<PipelineStage>(lead.pipelineStage);
  const [assignedTLMK, setAssignedTLMK] = useState(lead.assignedTLMK || tlmkList[0] || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      await onSave(lead.id, {
        name: name.trim() || lead.name,
        companyName: company.trim(),
        company: company.trim(),
        phone: phone.trim() || lead.phone,
        contractValue: Number(dealValue) || 0,
        dealValue: Number(dealValue) || 0,
        campaignName: campaign.trim() || lead.campaignName,
        pipelineStage: stage,
        assignedTLMK: assignedTLMK || lead.assignedTLMK
      });
      onToggle(); // Cierra la ventana abatible al guardar
    } catch (err) {
      console.error('Error saving lead header:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentColumn = pipelineColumns.find(c => c.id === lead.pipelineStage) || pipelineColumns[0];

  return (
    <div className="w-full">
      {/* Cabezal de la Ficha (Siempre visible con su Estatus y Botón Abatible) */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex-1 min-w-0">
          {/* Status Badge persistente en todo momento */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shadow-sm ${currentColumn.badgeBg} ${currentColumn.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {currentColumn.label.split('(')[0].trim()}
            </span>

            {lead.campaignName && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate max-w-[120px]">
                {lead.campaignName}
              </span>
            )}
          </div>

          <h4 className={`font-bold text-white tracking-wide truncate ${size === 'lg' ? 'text-base' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {lead.name}
          </h4>
          <p className={`text-slate-400 truncate ${size === 'lg' ? 'text-xs' : 'text-[11px]'}`}>
            {lead.companyName || lead.company || 'Oportunidad / Sin Empresa'}
          </p>
        </div>

        {/* Botón de la Ventana Abatible */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            isOpen 
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]' 
              : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
          }`}
          title={isOpen ? "Cerrar ventana abatible" : "Abrir edición abatible del cabezal"}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden sm:inline">{isOpen ? 'Cerrar' : 'Editar'}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* VENTANA ABATIBLE (Collapsible Drawer / Drawer abatible) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form 
              onSubmit={handleSave} 
              onClick={(e) => e.stopPropagation()} 
              className="mt-3 p-3 bg-slate-950/90 border border-[#00F0FF]/30 rounded-2xl space-y-2.5 shadow-xl text-left"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00F0FF] flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edición Abatible de Ficha
                </span>
                <button
                  type="button"
                  onClick={onToggle}
                  className="text-slate-500 hover:text-white p-0.5 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Nombre y Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    Nombre del Prospecto
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    Empresa / Negocio
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ej. Distribuciones del Sur"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              {/* Teléfono y Valor de la Oportunidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    Valor Oportunidad (USD)
                  </label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              {/* Estatus / Etapa y TLMK Asignado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    Estatus / Etapa en Todo Momento
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as PipelineStage)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF] font-bold"
                  >
                    {pipelineColumns.map(col => (
                      <option key={col.id} value={col.id} className="bg-slate-900 text-white">
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                    TLMK Asignado
                  </label>
                  <select
                    value={assignedTLMK}
                    onChange={(e) => setAssignedTLMK(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                  >
                    {tlmkList.map(t => (
                      <option key={t} value={t} className="bg-slate-900 text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campaña */}
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">
                  Campaña Meta Ads / Fuente
                </label>
                <input
                  type="text"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="Meta Ads / Instagram Lead Gen"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onToggle}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  {saving ? 'Guardando...' : 'Guardar Ficha'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
