import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  FileText, 
  Search, 
  Calendar, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  Filter 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AuditLog() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: any[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() });
        });
        setLogs(loaded);
        setLoading(false);
      },
      (err) => {
        console.warn('Error fetching audit logs:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const filteredLogs = logs.filter((l) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchAction = (l.action || '').toLowerCase().includes(q);
      const matchUser = (l.userEmail || '').toLowerCase().includes(q);
      const matchTarget = (l.targetEmail || l.targetName || '').toLowerCase().includes(q);
      return matchAction || matchUser || matchTarget;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o registro afectado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#00F0FF]"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Registros capturados: <strong className="text-white">{filteredLogs.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Cargando registros de auditoría...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
          No se encontraron registros de auditoría.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Operador Responsable</th>
                <th className="py-3 px-4">Destino / Registro</th>
                <th className="py-3 px-4">Resultado</th>
                <th className="py-3 px-4">Fecha / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white text-xs">{log.action}</td>
                  <td className="py-3 px-4 text-slate-300">{log.userEmail || 'Sistema'}</td>
                  <td className="py-3 px-4 text-slate-400">{log.targetEmail || log.targetName || log.targetId || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {log.result || 'SUCCESS'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
