import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  FormTemplate, 
  DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE, 
  SYSTEM_FIXED_FIELDS 
} from '../types/templates';
import TemplateBuilder from '../components/templates/TemplateBuilder';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  LayoutTemplate, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Share2, 
  ShieldCheck, 
  ArrowLeft, 
  Search, 
  Sparkles, 
  ExternalLink,
  ShieldAlert,
  Sliders,
  Eye,
  Settings
} from 'lucide-react';

export default function FormTemplates() {
  const { userData } = useOutletContext<{ userData: any }>() || {};
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'builder' | 'preview' | 'assign'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperationFilter, setSelectedOperationFilter] = useState<string>('all');

  // Permisos: Solo superadmin, ceo, admin y gestor pueden editar plantillas
  const userRole = userData?.role || 'tlmk';
  const canManageTemplates = ['superadmin', 'ceo', 'admin', 'gestor'].includes(userRole);

  // Carga reactiva de plantillas desde Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collection(db, 'form_templates');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: FormTemplate[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as FormTemplate);
          });
          setTemplates(list);
        } else {
          // Si la colección está vacía en Firestore, agregamos la plantilla estándar de fábrica
          setTemplates([DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE]);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Error reading form_templates from Firestore, fallback to local default:', err);
        setTemplates([DEFAULT_DISTRIBUTOR_APPOINTMENT_TEMPLATE]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtrado de plantillas
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch = 
      tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOp = selectedOperationFilter === 'all' || tpl.operationType === selectedOperationFilter;
    return matchesSearch && matchesOp;
  });

  // Iniciar creación de nueva plantilla
  const handleCreateNew = () => {
    const newTpl: FormTemplate = {
      id: `template_${Date.now()}`,
      name: 'Nueva Plantilla Operativa',
      description: 'Definición de campos y validaciones para nuevo tipo de gestión.',
      operationType: 'custom',
      assignedProjectIds: [],
      fields: [...SYSTEM_FIXED_FIELDS],
      exportCardHeader: '📍 CITA – Seguimiento de Lead',
      exportCardFooter: 'Ecosistema Kaivincia CRM',
      version: 1,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userData?.email || 'Admin'
    };
    setSelectedTemplate(newTpl);
    setViewMode('builder');
  };

  // Duplicar plantilla
  const handleCloneTemplate = async (templateToClone: FormTemplate) => {
    const clonedId = `template_${Date.now()}`;
    const cloned: FormTemplate = {
      ...templateToClone,
      id: clonedId,
      name: `${templateToClone.name} (Copia)`,
      isDefault: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userData?.email || 'Admin'
    };

    try {
      await setDoc(doc(db, 'form_templates', clonedId), {
        ...cloned,
        firestoreUpdatedAt: serverTimestamp()
      });
      setSelectedTemplate(cloned);
      setViewMode('builder');
    } catch (e) {
      console.error('Error cloning template:', e);
    }
  };

  // Eliminar plantilla
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la plantilla "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'form_templates', id));
        await addDoc(collection(db, 'audit_logs'), {
          action: 'DELETE_FORM_TEMPLATE',
          category: 'ACCESS',
          userEmail: userData?.email || 'admin@kaivincia.com',
          targetId: id,
          targetName: name,
          result: 'SUCCESS',
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error('Error deleting template:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
              Módulo 6 • Arquitectura Operativa
            </span>
            <span className="text-slate-500 text-xs font-mono">Motor de Formularios v2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
            <LayoutTemplate className="w-7 h-7 text-[#00F0FF]" />
            Plantillas de Ficha Configurables
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
            Diseña fichas dinámicas por proyecto o tipo de operación. Controla campos obligatorios, coordenadas GPS, reglas de validación y genera formatos entregables listos para distribuidores.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2.5">
          {viewMode !== 'list' ? (
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la Lista
            </button>
          ) : (
            canManageTemplates && (
              <button
                onClick={handleCreateNew}
                className="px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#22D3EE] text-black text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                Crear Plantilla
              </button>
            )
          )}
        </div>
      </div>

      {/* Control de Permisos si el usuario es de rol básico */}
      {!canManageTemplates && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-bold">Modo de Solo Consulta (Rol {userRole.toUpperCase()}):</span> Los colaboradores y teleoperadores pueden visualizar y utilizar las plantillas asignadas a sus proyectos, pero la configuración y creación está reservada para roles de Gestión y Administración.
          </div>
        </div>
      )}

      {/* VISTA 1: Lista de Plantillas */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Filtros y Buscador */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar plantilla por nombre o propósito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-[#00F0FF]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Operación:</span>
              <select
                value={selectedOperationFilter}
                onChange={(e) => setSelectedOperationFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-[#00F0FF]"
              >
                <option value="all">Todas las Operaciones</option>
                <option value="cita_distribuidor">Citas Distribuidor</option>
                <option value="prospeccion_tlmk">Prospección TLMK</option>
                <option value="onboarding_cliente">Onboarding</option>
                <option value="custom">Personalizadas</option>
              </select>
            </div>
          </div>

          {/* Grid de Plantillas */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              Cargando plantillas de Firestore...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl space-y-3">
              <LayoutTemplate className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">No se encontraron plantillas</div>
              <p className="text-xs text-slate-500">Crea una nueva plantilla para personalizar las fichas de tus proyectos.</p>
              {canManageTemplates && (
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Crear Primera Plantilla
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tpl) => {
                const customFieldsCount = tpl.fields.filter((f) => !f.isSystemFixed).length;
                const exportableCount = tpl.fields.filter((f) => f.exportToCard).length;

                return (
                  <div
                    key={tpl.id}
                    className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800/80 hover:border-[#00F0FF]/40 transition-all flex flex-col justify-between space-y-4 group relative shadow-lg"
                  >
                    <div>
                      {/* Badge superior */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-950/60 text-cyan-400 border border-cyan-800/40">
                          {tpl.operationType.replace('_', ' ').toUpperCase()}
                        </span>
                        {tpl.isDefault && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Predeterminada
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">
                          v{tpl.version || 1}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white group-hover:text-[#00F0FF] transition-colors leading-tight">
                        {tpl.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {tpl.description || 'Sin descripción detallada.'}
                      </p>

                      {/* Métricas de campos */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-center">
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="block text-sm font-black text-white">{tpl.fields.length}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">Totales</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="block text-sm font-black text-cyan-400">{customFieldsCount}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">Custom</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="block text-sm font-black text-emerald-400">{exportableCount}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-mono">Exportables</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción de la tarjeta */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-1">
                        {canManageTemplates && (
                          <button
                            onClick={() => handleCloneTemplate(tpl)}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer transition-all"
                            title="Duplicar plantilla"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canManageTemplates && !tpl.isDefault && (
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 cursor-pointer transition-all"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTemplate(tpl);
                            setViewMode('builder');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#00F0FF]" />
                          {canManageTemplates ? 'Editar Ficha' : 'Ver Ficha'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Diseñador de Plantillas (TemplateBuilder + FieldEditor) */}
      {viewMode === 'builder' && selectedTemplate && (
        <TemplateBuilder
          initialTemplate={selectedTemplate}
          currentUserEmail={userData?.email}
          onSaved={(saved) => {
            setSelectedTemplate(saved);
            // Actualizar en el estado local de plantillas
            setTemplates((prev) => {
              const idx = prev.findIndex((p) => p.id === saved.id);
              if (idx >= 0) {
                const clone = [...prev];
                clone[idx] = saved;
                return clone;
              }
              return [...prev, saved];
            });
          }}
          onOpenPreview={(tpl) => {
            setSelectedTemplate(tpl);
            setViewMode('preview');
          }}
        />
      )}
    </div>
  );
}
