import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, Database, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { LeadOpportunity } from '../../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: Partial<LeadOpportunity>[]) => Promise<void>;
  tlmkList: string[];
}

export default function MetaImportModal({ isOpen, onClose, onImport, tlmkList }: Props) {
  const [parsedData, setParsedData] = useState<Partial<LeadOpportunity>[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [defaultCampaign, setDefaultCampaign] = useState('Meta Ads - Campaña High Ticket USA');
  const [assignedTLMK, setAssignedTLMK] = useState(tlmkList[0] || 'Zaydeli De La Rosa');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          mapRowsToLeads(results.data);
        }
      });
    } else {
      // Excel reader
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        mapRowsToLeads(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  const mapRowsToLeads = (rows: any[]) => {
    const mapped: Partial<LeadOpportunity>[] = rows.map((r, idx) => {
      // Find possible column names
      const name = r.name || r.Nombre || r.full_name || r.Cliente || r.contacto || `Lead Meta #${idx + 1}`;
      const phone = String(r.phone || r.telefono || r.celular || r.mobile || r.Telefono || '').trim();
      const email = r.email || r.correo || r.Email || '';
      const company = r.company || r.empresa || r.Company || '';
      const campaign = r.campaign || r.campaign_name || r.campana || defaultCampaign;
      const tlmk = r.tlmk || r.agente || tlmkList[idx % tlmkList.length] || assignedTLMK;

      return {
        name,
        phone: phone || '+12135550000',
        email: email || undefined,
        companyName: company || undefined,
        source: 'meta_ads',
        campaignName: campaign,
        pipelineStage: 'LEAD_IN',
        assignedTLMK: tlmk,
        contractValue: Number(r.value || r.monto || 1500),
        healthScore: 90,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: [{
          id: `note_imp_${Date.now()}_${idx}`,
          author: 'Sistema Meta Lead Ads',
          text: `Contacto capturado desde campaña publicitaria: "${campaign}"`,
          createdAt: new Date().toISOString()
        }]
      };
    });

    setParsedData(mapped);
  };

  const loadPresetMetaData = () => {
    setFileName('Campana_Meta_Ads_California_NY.csv (Base de Datos Oficial)');
    const preset: Partial<LeadOpportunity>[] = [
      {
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
        isOverdue: true, // Mark as overdue to show alert
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
        name: 'Elena Rostova',
        companyName: 'Empire Real Estate NY',
        phone: '+1 (631) 890-4412', // New York 631
        email: 'elena@empirerealty.com',
        source: 'meta_ads',
        campaignName: 'Meta Ads: Inversionistas NY & NJ',
        pipelineStage: 'LEAD_IN',
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
        name: 'David Steinberg',
        companyName: 'Denver Peaks Consulting',
        phone: '+1 (720) 651-7890', // Colorado 720
        email: 'david@denverpeaks.co',
        source: 'meta_ads',
        campaignName: 'Meta Ads: Consultoría High Ticket',
        pipelineStage: 'CONTACTADO',
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
      },
      {
        name: 'Jessica Valenzuela',
        companyName: 'Pacific Health Solutions',
        phone: '+1 (562) 330-8819', // California 562
        email: 'jessica@pacifichealth.org',
        source: 'meta_ads',
        campaignName: 'Meta Ads: Sector Salud California',
        pipelineStage: 'LEAD_IN',
        assignedTLMK: 'Carlos Méndez',
        contractValue: 5000,
        healthScore: 85,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        notes: [{
          id: 'n_5',
          author: 'Meta Lead Ads API',
          text: 'Registro vía anuncio de Facebook Leads.',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
        }]
      }
    ];

    setParsedData(preset);
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    try {
      await onImport(parsedData);
      onClose();
    } catch (e) {
      console.error("Error importing leads:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Carga de Data / Leads Meta Ads</h3>
              <p className="text-[10px] text-slate-400 font-mono">Importa contactos de campañas de Facebook e Instagram Ads</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preset generator button */}
          <div className="bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border border-blue-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-cyan-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Base de Campañas Meta USA
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Carga automáticamente 5 contactos listos de campañas de Facebook con DIDs de California, NY, Denver y NJ.
              </p>
            </div>
            <button
              onClick={loadPresetMetaData}
              className="shrink-0 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              Cargar Base Meta
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-700 hover:border-[#00F0FF] rounded-2xl p-6 text-center transition-all bg-slate-900/30">
            <input
              type="file"
              id="meta-file-upload"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="meta-file-upload" className="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-500 mb-2 hover:text-[#00F0FF] transition-colors" />
              <span className="text-xs font-bold text-white mb-1">
                {fileName ? fileName : 'Selecciona o arrastra tu archivo CSV o Excel de Meta Ads'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Columnas admitidas: Nombre, Teléfono, Empresa, Email, Campaña
              </span>
            </label>
          </div>

          {/* Preview list */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Contactos Detectados ({parsedData.length})</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Listos para importar
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {parsedData.map((lead, i) => (
                  <div key={i} className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{lead.name}</p>
                      <p className="text-[10px] font-mono text-emerald-400">{lead.phone} • <span className="text-slate-400">{lead.companyName || 'Independiente'}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {lead.campaignName}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">Asignado a: <strong className="text-white">{lead.assignedTLMK}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedData.length === 0 || loading}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider text-black bg-[#00F0FF] hover:bg-[#22D3EE] rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              {loading ? 'Guardando en CRM...' : `Importar ${parsedData.length} Contactos`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
