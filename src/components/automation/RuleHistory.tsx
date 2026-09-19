import { useState, useEffect } from 'react';
import { AutomationLog, Area } from '../../types/automation';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where 
} from 'firebase/firestore';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  AlertTriangle, 
  Search,
  Eye
} from 'lucide-react';

interface RuleHistoryProps {
  filterRuleId?: string;
  filterArea?: Area;
  onRetryExecution?: (log: AutomationLog) => Promise<void>;
}

export default function RuleHistory({
  filterRuleId,
  filterArea,
  onRetryExecution
}: RuleHistoryProps) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'partial' | 'no_match'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AutomationLog | null>(null);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    let q = query(
      collection(db, 'automation_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    if (filterRuleId) {
      q = query(
        collection(db, 'automation_logs'),
        where('ruleId', '==', filterRuleId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs: AutomationLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedLogs.push({
            id: docSnap.id,
            ruleId: data.ruleId,
            ruleName: data.ruleName || 'Regla de Automatización',
            area: data.area,
            event: data.event,
            payload: data.payload || {},
            conditionsMatched: data.conditionsMatched ?? true,
            actionsExecuted: data.actionsExecuted || [],
            errors: data.errors || [],
            retries: data.retries || 0,
            status: data.status || 'completed',
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
          });
        });
        setLogs(fetchedLogs);
        setLoading(false);
      },
      (error) => {
        console.warn('Error suscribiéndose a logs de automatización:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterRuleId]);

  const filteredLogs = logs.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (filterArea && l.area !== filterArea) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = l.ruleName.toLowerCase().includes(term);
      const matchEvent = l.event.toLowerCase().includes(term);
      const matchArea = l.area.toLowerCase().includes(term);
      return matchName || matchEvent || matchArea;
    }
    return true;
  });

  const handleRetry = async (log: AutomationLog) => {
    if (!onRetryExecution) return;
    setRetryingLogId(log.id);
    try {
      await onRetryExecution(log);
    } finally {
      setRetryingLogId(null);
    }
  };

  const formatTimestamp = (ts: any) => {
    try {
      const d = new Date(ts);
      return `${d.toLocaleTimeString()} (${d.toLocaleDateString()})`;
    } catch {
      return 'Fecha no disponible';
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por regla, evento o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#00F0FF]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completados
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'failed'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Fallidos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('no_match')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'no_match'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Sin Coincidencia
          </button>
        </div>
      </div>

      {/* Tabla de Logs */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Cargando auditoría de automatizaciones...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs space-y-1">
          <p>No se encontraron registros de auditoría para los criterios seleccionados.</p>
          <p className="text-[10px] text-slate-600">Los eventos disparados aparecerán aquí en tiempo real.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] font-mono uppercase tracking-widest text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Regla / Evento</th>
                <th className="py-3 px-4">Área</th>
                <th className="py-3 px-4">Acciones</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* Estado */}
                  <td className="py-3 px-4">
                    {log.status === 'completed' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Completado
                      </span>
                    ) : log.status === 'failed' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Fallido
                      </span>
                    ) : log.status === 'partial' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Parcial
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" /> Ignorado
                      </span>
                    )}
                  </td>

                  {/* Regla y Evento */}
                  <td className="py-3 px-4">
                    <div className="font-sans font-bold text-white text-xs">{log.ruleName}</div>
                    <div className="text-[10px] text-slate-400">{log.event}</div>
                  </td>

                  {/* Área */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                      {log.area}
                    </span>
                  </td>

                  {/* Acciones ejecutadas */}
                  <td className="py-3 px-4 text-slate-300">
                    <span className="font-bold text-white">{log.actionsExecuted.length}</span> ejecutadas
                  </td>

                  {/* Fecha */}
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {formatTimestamp(log.timestamp)}
                  </td>

                  {/* Botones */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {log.status === 'failed' && onRetryExecution && (
                        <button
                          type="button"
                          disabled={retryingLogId === log.id}
                          onClick={() => handleRetry(log)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className={`w-3 h-3 ${retryingLogId === log.id ? 'animate-spin' : ''}`} />
                          Reintentar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                        title="Ver detalle del payload y acciones"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalle Exhaustivo del Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-[2rem] max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase italic">
                  Detalle de Auditoría de Ejecución
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  ID: {selectedLog.id} • {selectedLog.ruleName}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Errores si existieron */}
            {selectedLog.errors && selectedLog.errors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Errores Reportados:
                </div>
                {selectedLog.errors.map((err, idx) => (
                  <p key={idx} className="font-mono text-[11px]">• {err}</p>
                ))}
              </div>
            )}

            {/* Payload de Entrada */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
                Datos de Entrada del Evento (Payload):
              </label>
              <pre className="p-3 rounded-xl bg-black/80 border border-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-44">
                {JSON.stringify(selectedLog.payload, null, 2)}
              </pre>
            </div>

            {/* Acciones */}
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
                Acciones Ejecutadas ({selectedLog.actionsExecuted.length}):
              </label>
              <div className="space-y-1.5">
                {selectedLog.actionsExecuted.map((a, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white font-bold mr-2">{a.actionType}</span>
                      <span className="text-[11px] text-slate-400">{a.message}</span>
                    </div>
                    <span className={a.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
