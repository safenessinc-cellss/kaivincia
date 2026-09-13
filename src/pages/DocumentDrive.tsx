import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, FileText, Upload, Filter, Shield, 
  Clock, Download, FileSignature, CheckCircle2,
  Lock, Key, FileCheck, Star, Eye, ShieldCheck,
  ScanFace, X, FileUp, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

type Category = 'CISO' | 'Legal' | 'iso9001' | 'RRHH';
type Status = 'approved' | 'pending' | 'draft';

interface DocumentFile {
  id: string;
  title: string;
  type: string;
  status: Status;
  size: string;
  date: string;
  tags: string[];
  category: string;
}

const INITIAL_DOCS: DocumentFile[] = [
  { id: 'DOC-991', title: 'Políticas de Seguridad CISO', type: 'pdf', status: 'approved', size: '2.4 MB', date: new Date().toISOString(), tags: ['Confidencial', 'Regulatorio'], category: 'CISO' },
  { id: 'DOC-992', title: 'Contrato Master Alpha Ind.', type: 'pdf', status: 'pending', size: '1.1 MB', date: new Date(Date.now() - 86400000).toISOString(), tags: ['Legal', 'B2B'], category: 'Legal' },
  { id: 'DOC-993', title: 'Estructura Salarial 2026', type: 'xls', status: 'draft', size: '840 KB', date: new Date(Date.now() - 172800000).toISOString(), tags: ['RRHH', 'Confidencial'], category: 'RRHH' },
];

export default function DocumentDrive() {
  const [docs, setDocs] = useState<DocumentFile[]>(INITIAL_DOCS);
  const [activeTab, setActiveTab] = useState('all');
  
  // Auth Modal (CISO specific)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedFileForAuth, setSelectedFileForAuth] = useState<string | null>(null);
  
  // Upload Flow States
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [classificationModalOpen, setClassificationModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isRSAActive, setIsRSAActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for classification
  const [formData, setFormData] = useState({
     category: 'Legal' as Category,
     code: '',
     version: '1.0'
  });

  const filteredDocs = docs.filter(t => activeTab === 'all' || activeTab === 'starred' || t.category.toLowerCase() === activeTab.toLowerCase());

  const handleFileAction = (doc: DocumentFile, action: string) => {
    if (doc.category === 'CISO') {
      setSelectedFileForAuth(doc.title);
      setAuthModalOpen(true);
    } else {
      if (action === 'sign') {
         setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'approved' as Status } : d));
         alert(`Documento ${doc.title} firmado digitalmente bajo formato ISO 9001.`);
      } else if (action === 'view') {
         alert(`Abriendo visor para: ${doc.title}`);
      } else if(action === 'download') {
         alert(`Descargando: ${doc.title}`);
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
     }
  };

  const handleFileSelection = (file: File) => {
     const ext = file.name.split('.').pop()?.toLowerCase();
     if (!['pdf', 'docx', 'csv'].includes(ext || '')) {
        alert("Solo se permiten archivos PDF, DOCX o CSV.");
        return;
     }
     setStagedFile(file);
     setFormData({ ...formData, code: `KV-SGI-${Math.floor(1000 + Math.random() * 9000)}` });
     setClassificationModalOpen(true);
  };

  const submitClassification = () => {
     if (!stagedFile) return;
     
     const isCiso = formData.category === 'CISO';
     setIsRSAActive(isCiso);
     setClassificationModalOpen(false);
     setUploadProgress(0);

     // Simulate GSuite / Encrypted Upload
     const interval = setInterval(() => {
        setUploadProgress(prev => {
           if (prev === null) return null;
           const next = prev + 20;
           if (next >= 100) {
              clearInterval(interval);
              finishUpload();
              return 100;
           }
           return next;
        });
     }, 400);
  };

  const finishUpload = () => {
     setTimeout(() => {
        const isCiso = formData.category === 'CISO';
        const newDoc: DocumentFile = {
           id: formData.code,
           title: stagedFile?.name || 'Documento Importado',
           type: stagedFile?.name.split('.').pop() || 'pdf',
           status: 'pending',
           size: '1.5 MB', // mock size
           date: new Date().toISOString(),
           tags: isCiso ? ['Cifrado RSA-4096', 'High Security'] : ['Importado'],
           category: formData.category
        };
        
        setDocs(prev => [newDoc, ...prev]);
        setUploadProgress(null);
        setStagedFile(null);
        setIsRSAActive(false);
        setActiveTab('all');
        
        // Timeout for toast
        setTimeout(() => alert(isCiso ? "Documento Cifrado y Almacenado en Vault SGI" : "Documento Almacenado en Vault SGI"), 100);
     }, 500);
  };

  return (
    <div 
      className="p-8 space-y-8 bg-[#020617] h-full min-h-[calc(100vh-4rem)] relative overflow-hidden flex flex-col"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />

      {/* Global Drag Overlay */}
      <AnimatePresence>
         {isDragging && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-50 bg-[#020617]/80 backdrop-blur border-4 border-dashed border-[#22D3EE] flex flex-col items-center justify-center m-4 rounded-3xl"
            >
               <FileUp className="w-24 h-24 text-[#22D3EE] mb-4 animate-bounce" />
               <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#22D3EE]">Dropzone Activa</h2>
               <p className="text-gray-400 font-mono text-sm mt-2">Suelta el archivo para iniciar la clasificación SGI</p>
               <p className="text-gray-500 font-mono text-xs mt-1">(Soporta PDF, DOCX, CSV)</p>
            </motion.div>
         )}
      </AnimatePresence>

      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept=".pdf,.docx,.csv" 
         onChange={handleFileInput} 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-white">
            <ShieldCheck className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" /> 
            Drive <span className="text-slate-500">// Vault SGI</span>
          </h1>
          <p className="text-slate-400 font-mono text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-3 h-3 text-emerald-400" /> Repositorio documental cifrado (ISO 27001 / 9001)
          </p>
        </div>
        <button 
         onClick={() => fileInputRef.current?.click()}
         className="bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 px-6 py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-2 hover:bg-cyan-400 hover:text-[#020617] transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
        >
          <Upload className="w-4 h-4" /> Importar Documento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 flex-1 overflow-hidden">
        {/* Sidebar Folders */}
        <div className="md:col-span-1 space-y-4 flex flex-col">
          <div className="bg-[#0f172a]/80 border border-[#1E293B] backdrop-blur-md rounded-3xl p-4 shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Estructura ISO</h3>
            <div className="space-y-1">
              {[
                { id: 'all', icon: Folder, label: 'Todos los Archivos' },
                { id: 'Legal', icon: FileSignature, label: 'Legal & Contratos' },
                { id: 'iso9001', icon: FileCheck, label: 'Manuales ISO 9001' },
                { id: 'CISO', icon: Shield, label: 'CISO / Seguridad' },
                { id: 'RRHH', icon: FileText, label: 'Recursos Humanos' },
                { id: 'starred', icon: Star, label: 'Destacados' },
              ].map(folder => (
                <button 
                  key={folder.id}
                  onClick={() => setActiveTab(folder.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === folder.id ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'text-slate-400 hover:bg-[#1E293B]/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                     <folder.icon className="w-4 h-4" />
                     {folder.label}
                  </span>
                  {activeTab === folder.id && <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-1.5 py-0.5 rounded">{filteredDocs.length}</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div className={`mt-auto bg-gradient-to-b from-[#0f172a] to-[#020617] border rounded-3xl p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300 ${isRSAActive ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-[#1E293B]'}`}>
             <div className="absolute inset-0 bg-cyan-400/5" />
             {isRSAActive && <div className="absolute inset-0 border-2 border-cyan-400 rounded-3xl animate-[pulse_1s_infinite]" />}
             
             <Key className={`w-8 h-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mx-auto mb-3 relative z-10 transition-colors ${isRSAActive ? 'text-white' : 'text-cyan-400'}`} />
             <p className={`text-[9px] font-mono uppercase tracking-widest mb-1 relative z-10 ${isRSAActive ? 'text-cyan-200' : 'text-cyan-400/70'}`}>Cifrado Militar</p>
             <h4 className={`text-sm font-black drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] mb-2 relative z-10 tracking-widest ${isRSAActive ? 'text-white' : 'text-cyan-400'}`}>RSA-4096 ACTIVO</h4>
             <p className="text-xs text-slate-400 leading-relaxed relative z-10 mt-2">
               {isRSAActive ? 'Asegurando el canal de transmisión de datos...' : 'Los archivos subidos a la carpeta "CISO" requieren autenticación.'}
             </p>
          </div>
        </div>

        {/* Main Drive View */}
        <div className="md:col-span-3 bg-[#0f172a]/80 border border-[#1E293B] backdrop-blur-md rounded-3xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col">
          {/* Progress Overlay */}
          <AnimatePresence>
            {uploadProgress !== null && (
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-x-0 top-0 z-20 bg-[#0f172a] border-b border-[#1E293B] p-4 flex flex-col justify-center shadow-lg"
               >
                  <div className="flex justify-between items-center mb-2">
                     <h4 className="text-xs font-black uppercase tracking-widest text-[#22D3EE] flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 animate-pulse" /> Sincronizando con Google Workspace API
                     </h4>
                     <span className="text-xs font-mono text-gray-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
               </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mb-6 shrink-0 mt-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              {activeTab === 'all' ? 'Acceso Reciente' : activeTab.replace('iso', 'ISO ')}
            </h2>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filtrar
            </button>
          </div>

          <div className="overflow-x-auto flex-1 h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0f172a] z-10">
                <tr className="border-b border-[#1E293B] text-[9px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="pb-3 pl-4">Nombre de Archivo</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Fecha de Mod.</th>
                  <th className="pb-3 text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, idx) => (
                  <tr key={doc.id} className="border-b border-[#1E293B] hover:bg-[#1E293B]/30 transition-all duration-300 group relative">
                    <td className="py-4 pl-4 min-w-[280px] relative">
                      {doc.category === 'CISO' && (
                        <div className="absolute inset-y-0 left-0 w-0 bg-cyan-400/20 group-hover:w-full transition-all duration-500 ease-out z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 overflow-hidden pointer-events-none">
                           <div className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
                              <div className="w-full h-0.5 bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-[scan_2s_infinite]" />
                           </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.category === 'CISO' ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-800 text-slate-300'}`}>
                          {doc.category === 'CISO' ? <ShieldCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold transition-colors uppercase tracking-tight truncate max-w-[200px] ${doc.category === 'CISO' ? 'group-hover:text-cyan-400 text-gray-200' : 'group-hover:text-indigo-400 text-gray-200'}`}>
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-[9px] text-slate-500 font-mono">{doc.size} • ID: {doc.id}</p>
                             {doc.tags.map(tag => (
                                <span key={tag} className={`px-1 py-0.5 rounded text-[8px] font-mono ${tag.includes('High') || tag.includes('Cifrado') ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-gray-400'}`}>
                                   {tag}
                                </span>
                             ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 relative z-10 w-24">
                      {doc.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Aprobado</span>}
                      {doc.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/20"><Clock className="w-3 h-3" /> Revisión</span>}
                      {doc.status === 'draft' && <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-500/10 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-500/20">Borrador</span>}
                    </td>
                    <td className="py-4 text-[11px] font-mono text-slate-400 relative z-10 whitespace-nowrap">
                      {format(new Date(doc.date), 'dd MMM yy, HH:mm')}
                    </td>
                    <td className="py-4 pr-4 relative z-10 w-32">
                      <div className={`flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity ${doc.category === 'CISO' ? 'opacity-100' : ''}`}>
                        {doc.category === 'CISO' && (
                          <div className="mr-1 flex items-center justify-center p-1 bg-cyan-500/10 rounded animate-pulse shadow-[0_0_5px_rgba(34,211,238,0.3)] pointer-events-none">
                            <ScanFace className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                        )}
                        <button onClick={() => handleFileAction(doc, 'view')} className="p-1.5 bg-[#1E293B] rounded hover:bg-[#334155] hover:text-cyan-400 text-slate-300 transition-colors" title="Ver Documento">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleFileAction(doc, 'download')} className="p-1.5 bg-[#1E293B] rounded hover:bg-[#334155] hover:text-emerald-400 text-slate-300 transition-colors" title="Descargar">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleFileAction(doc, 'sign')} className="p-1.5 bg-[#1E293B] rounded hover:bg-[#334155] hover:text-amber-400 text-slate-300 transition-colors" title="Firmar">
                          <FileSignature className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocs.length === 0 && (
                  <tr>
                     <td colSpan={4} className="text-center py-12 text-gray-500 font-mono text-xs">No hay documentos en esta vista.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SGI Classification Modal */}
      <AnimatePresence>
         {classificationModalOpen && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-sm p-4"
            >
               <motion.div 
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                  className="bg-[#0f172a] border border-[#1E293B] rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
               >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                  <div className="flex items-start justify-between mb-6">
                     <div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-white mb-1">Clasificación SGI</h3>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Protocolo de Ingesta Documental</p>
                     </div>
                     <button onClick={() => setClassificationModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="mb-6 p-3 bg-black/30 border border-white/5 rounded-lg flex items-center gap-3">
                     <FileText className="w-6 h-6 text-[#22D3EE]" />
                     <div className="truncate">
                        <p className="text-sm font-bold text-gray-200 truncate">{stagedFile?.name}</p>
                        <p className="text-[10px] font-mono text-gray-500">{(stagedFile?.size ? (stagedFile.size / 1024).toFixed(1) : 0)} KB</p>
                     </div>
                  </div>

                  <form className="space-y-4" onSubmit={e => { e.preventDefault(); submitClassification(); }}>
                     {/* Category Selector */}
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Categoría Organizacional (ISO)</label>
                        <select 
                           value={formData.category}
                           onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                           className="w-full bg-[#020617] border border-[#1E293B] text-gray-200 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                        >
                           <option value="Legal">Legal & Fiscal</option>
                           <option value="iso9001">Manuales ISO 9001</option>
                           <option value="RRHH">Recursos Humanos</option>
                           <option value="CISO">Seguridad de la Información (CISO)</option>
                        </select>
                        {formData.category === 'CISO' && (
                           <div className="mt-2 flex items-center gap-2 text-cyan-400 text-[10px] font-mono uppercase tracking-widest bg-cyan-400/10 px-2 py-1 rounded">
                              <AlertCircle className="w-3 h-3" /> Requiere Cifrado RSA-4096
                           </div>
                        )}
                     </div>

                     {/* Document Code */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Código Asignado</label>
                           <input 
                              type="text"
                              value={formData.code}
                              onChange={e => setFormData({ ...formData, code: e.target.value })}
                              className="w-full bg-[#020617] border border-[#1E293B] font-mono text-cyan-400 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Versión Inicial</label>
                           <input 
                              type="text"
                              value={formData.version}
                              onChange={e => setFormData({ ...formData, version: e.target.value })}
                              className="w-full bg-[#020617] border border-[#1E293B] text-gray-200 text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500 text-center"
                           />
                        </div>
                     </div>

                     <button type="submit" className="w-full mt-4 py-4 bg-cyan-500 text-[#020617] rounded-xl font-black uppercase italic tracking-[0.2em] shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                        {formData.category === 'CISO' ? <Lock className="w-4 h-4" /> : <Upload className="w-4 h-4"/>} 
                        {formData.category === 'CISO' ? 'Cifrar y Guardar' : 'Procesar Archivo'}
                     </button>
                  </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {authModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/90 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(34,211,238,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
                     <ShieldCheck className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black uppercase tracking-widest text-white">Doble Autenticación</h3>
                     <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Requerida para acceso CISO</p>
                   </div>
                </div>
                <button onClick={() => setAuthModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-[#020617] rounded-xl border border-[#1E293B] text-center">
                 <ScanFace className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                 <p className="text-sm font-medium text-slate-300">Escaneo biométrico o llave de seguridad requerida para:</p>
                 <p className="text-cyan-400 font-bold mt-2 uppercase tracking-wide">{selectedFileForAuth}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setAuthModalOpen(false)} className="flex-1 py-3 border border-[#1E293B] text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#1E293B] transition-colors">
                  Cancelar
                </button>
                <button onClick={() => { setAuthModalOpen(false); alert("Autenticación completada."); }} className="flex-1 py-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-400 hover:text-[#020617] shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all">
                  Proceder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}

