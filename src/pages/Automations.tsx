import { useState, useEffect } from 'react';
import { 
  Area, 
  AutomationRule, 
  AutomationLog 
} from '../types/automation';
import { AREAS } from '../config/automationCatalog';
import RuleBuilder from '../components/automation/RuleBuilder';
import RuleTester from '../components/automation/RuleTester';
import RuleHistory from '../components/automation/RuleHistory';
import RuleTemplates from '../components/automation/RuleTemplates';
import GuideTab from '../components/automation/GuideTab';
import { executeAutomationRule } from '../services/automationEngine';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Plus, 
  Play, 
  Sparkles, 
  Sliders, 
  History, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Power, 
  Search,
  Filter,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function Automations() {
  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'history' | 'guide'>('rules');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Estado de Reglas en Firestore
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Modales
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [testingRule, setTestingRule] = useState<AutomationRule | null>(null);

  // Usuario actual
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || 'user_demo';
  const currentUserName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operador';
  const canApprove = true; // Permisos para aprobar reglas

  // Suscripción en tiempo real a `automation_rules`
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'automation_rules'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AutomationRule[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || 'Regla sin nombre',
            description: data.description || '',
            area: data.area || 'Marketing',
            event: data.event,
            conditions: data.conditions || [],
            actions: data.actions || [],
            isActive: data.isActive ?? true,
            isApproved: data.isApproved ?? true,
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt,
            createdBy: data.createdBy || 'anon',
            createdByName: data.createdByName,
            executionCount: data.executionCount || 0,
            failureCount: data.failureCount || 0,
            lastRunAt: data.lastRunAt,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
          });
        });
        setRules(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Error leyendo automation_rules:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Guardar nueva regla o actualizar existente
  const handleSaveRule = async (
    ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingRule) {
      const docRef = doc(db, 'automation_rules', editingRule.id);
      await updateDoc(docRef, {
        ...ruleData,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'automation_rules'), {
        ...ruleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    setShowBuilder(false);
    setEditingRule(null);
  };

  // Toggle de activación / pausa
  const handleToggleActive = async (rule: AutomationRule) => {
    try {
      const docRef = doc(db, 'automation_rules', rule.id);
      await updateDoc(docRef, {
        isActive: !rule.isActive,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error al cambiar estado de regla:', err);
    }
  };

  // Eliminar regla
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta regla de automatización?')) return;
    try {
      await deleteDoc(doc(db, 'automation_rules', ruleId));
    } catch (err) {
      console.error('Error al eliminar regla:', err);
    }
  };

  // Usar plantilla prefabricada
  const handleUseTemplate = (templateData: any) => {
    setEditingRule(null);
    setShowBuilder(true);
    // Abrir builder con la plantilla precargada
    setEditingRule({
      id: '',
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActiveTab('rules');
  };

  // Reintentar log fallido
  const handleRetryLog = async (log: AutomationLog) => {
    const targetRule = rules.find((r) => r.id === log.ruleId);
    if (!targetRule) {
      alert('La regla asociada ya no existe en el sistema.');
      return;
    }
    await executeAutomationRule(targetRule, log.payload, 'manual_retry');
  };

  // Filtrado de reglas
  const filteredRules = rules.filter((r) => {
    if (selectedAreaFilter !== 'all' && r.area !== selectedAreaFilter) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchEvent = r.event.toLowerCase().includes(q);
      return matchName || matchDesc || matchEvent;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#06080C] text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Encabezado Superior */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/80 border border-slate-800/80 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Motor de Automatizaciones Sin Código
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-black uppercase tracking-widest">
                8 Áreas Conectadas
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
              Centro Operativo de Automatización
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Diseña flujos reactivos con la lógica natural <span className="text-white font-bold">«Cuando / Si / Hacer»</span>, programa contingencias con fallback y simula evaluaciones paso a paso sin afectar datos reales.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              type="button"
              onClick={() => {
                setEditingRule(null);
                setShowBuilder(true);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-cyan-400 hover:opacity-90 text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-xl shadow-[#00F0FF]/10 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Automatización
            </button>
          </div>
        </div>

        {/* Barra de Navegación de Pestañas */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
              Mis Reglas ({rules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Plantillas Maestras
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              Historial y Auditoría
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              Manual y Preguntas Frecuentes
            </button>
          </div>
        </div>

        {/* Modal Constructor de Regla */}
        {showBuilder && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full my-8">
              <RuleBuilder
                initialRule={editingRule}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                canApprove={canApprove}
                onSaveRule={handleSaveRule}
                onCancel={() => {
                  setShowBuilder(false);
                  setEditingRule(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Simulador de Regla (Dry-Run) */}
        {testingRule && (
          <RuleTester
            rule={testingRule}
            onClose={() => setTestingRule(null)}
          />
        )}

        {/* Contenido según la pestaña activa */}

        {/* PESTAÑA 1: REGLAS */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Barra de Filtro de Reglas */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filtrar automatizaciones..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#00F0FF]"
                />
              </div>

              {/* Selector de Área */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedAreaFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedAreaFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                {AREAS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAreaFilter(a.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      selectedAreaFilter === a.id
                        ? 'bg-blue-950 text-[#00F0FF] border border-blue-800'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Reglas */}
            {loading ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                Cargando automatizaciones configuradas...
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="p-16 border border-dashed border-slate-800 rounded-3xl bg-slate-950/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    No hay reglas configuradas para este criterio
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Crea tu primera regla personalizada o clona una de nuestras plantillas maestras probadas.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBuilder(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer transition-all"
                  >
                    Diseñar Nueva Regla
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('templates')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-800 cursor-pointer transition-all"
                  >
                    Ver Plantillas Listas
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                      rule.isActive
                        ? 'bg-slate-950/80 border-slate-800/80 hover:border-[#00F0FF]/30 shadow-xl'
                        : 'bg-slate-950/40 border-slate-900 opacity-65'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-[#00F0FF] border border-blue-800">
                              {rule.area}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                rule.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                              {rule.isActive ? 'Activa' : 'Pausada'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white leading-snug">
                            {rule.name}
                          </h3>
                          {rule.description && (
                            <p className="text-xs text-slate-400 mt-1">
                              {rule.description}
                            </p>
                          )}
                        </div>

                        {/* Switch de activación rápida */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title={rule.isActive ? 'Pausar regla' : 'Activar regla'}
                        >
                          <Power className={`w-4 h-4 ${rule.isActive ? 'text-emerald-400' : 'text-slate-600'}`} />
                        </button>
                      </div>

                      {/* Resumen de Flujo: Disparador, Condiciones y Acciones */}
                      <div className="p-3.5 rounded-2xl bg-black/50 border border-slate-900 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px]">
                          <span className="font-black">CUANDO:</span>
                          <span className="text-slate-200">{rule.event}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                          <span className="font-black">SI:</span>
                          <span className="text-slate-200">
                            {rule.conditions.length === 0
                              ? 'Siempre (sin filtros)'
                              : `${rule.conditions.length} condición(es)`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#00F0FF] font-mono text-[11px]">
                          <span className="font-black">HACER:</span>
                          <span className="text-slate-200">
                            {rule.actions.length} acción(es) en cadena
                          </span>
                        </div>
                      </div>

                      {/* Métricas de Ejecución */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                        <span>Ejecuciones: <strong className="text-white">{rule.executionCount}</strong></span>
                        {(rule.failureCount ?? 0) > 0 && (
                          <span className="text-rose-400">Fallos: {rule.failureCount}</span>
                        )}
                        <span>{rule.lastRunAt ? `Última: ${new Date(rule.lastRunAt).toLocaleDateString()}` : 'Sin ejecuciones'}</span>
                      </div>
                    </div>

                    {/* Botones de acción al pie de la tarjeta */}
                    <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setTestingRule(rule)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Simular (Dry-Run)
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRule(rule);
                            setShowBuilder(true);
                          }}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors"
                          title="Editar regla"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer transition-colors"
                          title="Eliminar regla"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: PLANTILLAS MAESTRAS */}
        {activeTab === 'templates' && (
          <RuleTemplates onUseTemplate={handleUseTemplate} />
        )}

        {/* PESTAÑA 3: HISTORIAL Y AUDITORÍA */}
        {activeTab === 'history' && (
          <RuleHistory onRetryExecution={handleRetryLog} />
        )}

        {/* PESTAÑA 4: GUÍA Y PREGUNTAS FRECUENTES */}
        {activeTab === 'guide' && (
          <GuideTab />
        )}

      </div>
    </div>
  );
}
