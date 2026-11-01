import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, Database } from 'lucide-react';
import Papa from 'papaparse';
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
  const defaultCampaign = 'Campaña sin especificar';
  const assignedTLMK = tlmkList[0] || '';
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName('');
    setParsedData([]);
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo supera el límite de 5 MB.');
      e.target.value = '';
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por seguridad, la importación Excel está temporalmente deshabilitada. Convierte el archivo a CSV y vuelve a intentarlo.');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parseWarning = results.errors.length > 0
          ? `El CSV contiene ${results.errors.length} advertencias de lectura. Revisa los datos antes de importar.`
          : undefined;
        mapRowsToLeads(results.data as any[], parseWarning);
      },
      error: (parseError) => setError(parseError.message || 'No se pudo leer el archivo CSV.')
    });
  };

  const mapRowsToLeads = (rows: any[], parseWarning?: string) => {
    const now = new Date().toISOString();
    const mapped = rows.reduce<Partial<LeadOpportunity>[]>((acc, row, idx) => {
      const name = String(row.name || row.Nombre || row.full_name || row.Cliente || row.contacto || '').trim();
      if (!name) return acc;

      const phone = String(row.phone || row.telefono || row.celular || row.mobile || row.Telefono || '').trim();
      const email = String(row.email || row.correo || row.Email || '').trim();
      const company = String(row.company || row.empresa || row.Company || '').trim();
      const campaign = String(row.campaign || row.campaign_name || row.campana || defaultCampaign).trim();
      const assignedAgent = String(
        row.tlmk || row.agente || (tlmkList.length > 0 ? tlmkList[idx % tlmkList.length] : assignedTLMK) || ''
      ).trim();
      const rawValue = Number(row.value ?? row.monto ?? 0);

      acc.push({
        name,
        phone,
        email: email || undefined,
        companyName: company || undefined,
        source: 'meta_ads',
        campaignName: campaign || 'Campaña sin especificar',
        pipelineStage: 'LEAD_IN',
        assignedTLMK: assignedAgent,
        contractValue: Number.isFinite(rawValue) ? rawValue : 0,
        healthScore: 0,
        createdAt: now,
        updatedAt: now,
        notes: [{
          id: `note_import_${Date.now()}_${idx}`,
          author: 'Importación CSV',
          text: `Contacto importado desde archivo CSV. Campaña: ${campaign || 'no especificada'}`,
          createdAt: now
        }]
      });
      return acc;
    }, []);

    if (mapped.length === 0) {
      setParsedData([]);
      setError('No se encontraron filas con un nombre de contacto válido. Revisa la columna Nombre.');
      return;
    }
    setParsedData(mapped);
    setError(parseWarning || null);
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    try {
      await onImport(parsedData);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la importación.');
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
          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-700 hover:border-[#00F0FF] rounded-2xl p-6 text-center transition-all bg-slate-900/30">
            <input
              type="file"
              id="meta-file-upload"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="meta-file-upload" className="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-500 mb-2 hover:text-[#00F0FF] transition-colors" />
              <span className="text-xs font-bold text-white mb-1">
                {fileName ? fileName : 'Selecciona un archivo CSV de Meta Ads (máximo 5 MB)'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Columnas admitidas: Nombre, Teléfono, Empresa, Email, Campaña. Excel temporalmente deshabilitado.
              </span>
            </label>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

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
