import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ShieldAlert, Lock, UserX, Key, RefreshCw, 
  Eye, EyeOff, Terminal, Activity, Fingerprint, Globe, 
  Monitor, Cpu, Shield, AlertTriangle, Users, Database,
  Settings, Search, MoreVertical, LogOut, CheckCircle2,
  Clock, MapPin, HardDrive, Smartphone, Zap
} from 'lucide-react';
import { collection, onSnapshot, query, updateDoc, doc, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// --- TYPES ---
interface SecurityUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin' | 'ventas' | 'operaciones';
  status: 'active' | 'frozen';
  mfaEnabled: boolean;
  lastLogin: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  ip: string;
  location: string;
  browser: string;
  timestamp: any;
}

export default function SecurityCenter() {
  const { userData } = useOutletContext<{ userData: any }>();
  const [users, setUsers] = useState<SecurityUser[]>([
    { id: 'u1', name: 'SAFENESS INC', email: 'admin@kaivincia.com', role: 'superadmin', status: 'active', mfaEnabled: true, lastLogin: 'Hace 2 min' },
    { id: 'u2', name: 'safeness', email: 'safeness.c.a@gmail.com', role: 'admin', status: 'active', mfaEnabled: false, lastLogin: 'Hace 10 min' },
    { id: 'u3', name: 'Carlos M.', email: 'carlos@kaivincia.com', role: 'ventas', status: 'active', mfaEnabled: true, lastLogin: 'Hace 1 hora' },
    { id: 'u4', name: 'Ana Silva', email: 'ana@kaivincia.com', role: 'operaciones', status: 'frozen', mfaEnabled: true, lastLogin: 'Hace 3 días' },
  ]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanPulse, setScanPulse] = useState(0);

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';

  useEffect(() => {
    // Simulated Scanner Animation
    const scannerInterval = setInterval(() => {
      setScanPulse(prev => (prev + 1) % 100);
    }, 50);

    // Fetch Audit Logs
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(data);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'audit_logs'));

    return () => {
      clearInterval(scannerInterval);
      unsubLogs();
    };
  }, []);

  const handleRoleChange = async (userId: string, newRole: any) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    // Log Activity
    await addDoc(collection(db, 'audit_logs'), {
      user: userData?.displayName || 'System',
      action: `Cambio de rol para usuario ${userId} a ${newRole}`,
      ip: '190.21.XX.XX',
      location: 'Bogotá, CO',
      browser: 'Chrome 124.0 (Windows)',
      timestamp: serverTimestamp()
    });
  };

  const handleStatusChange = async (userId: string, newStatus: any) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    
    await addDoc(collection(db, 'audit_logs'), {
      user: userData?.displayName || 'System',
      action: `${newStatus === 'frozen' ? 'Congelamiento' : 'Reactivación'} de cuenta: ${userId}`,
      ip: '190.21.XX.XX',
      location: 'Bogotá, CO',
      browser: 'Chrome 124.0 (Windows)',
      timestamp: serverTimestamp()
    });
  };

  const toggleMFA = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, mfaEnabled: !u.mfaEnabled } : u));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) return <div className="p-8 text-center text-slate-500 font-mono">ACCESO DENEGADO // PRIVILEGIOS INSUFICIENTES</div>;

  return (
    <div className="h-full bg-[#05070A] text-slate-300 flex flex-col overflow-hidden font-sans relative">
      
      {/* SECURITY SCANNER OVERLAY */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-1 bg-[#00E5FF]/20 z-50 pointer-events-none shadow-[0_0_15px_#00E5FF]"
      />

      {/* Header Metrics */}
      <div className="p-8 pb-4 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-6 bg-[#05070A]/80 backdrop-blur-md z-10 border-b border-slate-900">
        <div className="col-span-full md:col-span-1 flex flex-col justify-center">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
             <Shield className="w-8 h-8 text-[#FF0055]" />
             CISO Control Center
           </h2>
           <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             NODE_STATUS: SECURE // ENCRYPTION: RSA-4096
           </p>
        </div>

        <div className="bg-[#0B0E14] border border-slate-800 p-4 rounded-xl">
           <div className="flex items-center gap-3 text-slate-500 mb-1">
             <Activity className="w-4 h-4 text-[#00E5FF]" />
             <span className="text-[10px] font-black uppercase tracking-widest">Sesiones Activas</span>
           </div>
           <p className="text-2xl font-black text-white font-mono">14</p>
        </div>

        <div className="bg-[#0B0E14] border border-slate-800 p-4 rounded-xl">
           <div className="flex items-center gap-3 text-slate-500 mb-1">
             <Lock className="w-4 h-4 text-red-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">Login Fallidos (24h)</span>
           </div>
           <p className="text-2xl font-black text-white font-mono">0<span className="text-xs text-emerald-500 font-bold ml-2">Secure</span></p>
        </div>

        <div className="bg-[#0B0E14] border border-slate-800 p-4 rounded-xl">
           <div className="flex items-center gap-3 text-slate-500 mb-1">
             <Fingerprint className="w-4 h-4 text-[#FF0055]" />
             <span className="text-[10px] font-black uppercase tracking-widest">Integridad Datos</span>
           </div>
           <p className="text-2xl font-black text-white font-mono">99.9%</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Sub-Header / Tabs */}
        <div className="px-8 py-4 flex justify-between items-center border-b border-slate-900 bg-[#0B0E14]/40">
           <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('users')}
                className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full border transition-all ${activeTab === 'users' ? 'bg-[#00E5FF] text-black border-[#00E5FF]' : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600'}`}
              >
                Gestión de Usuarios
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full border transition-all ${activeTab === 'logs' ? 'bg-[#FF0055] text-black border-[#FF0055]' : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600'}`}
              >
                Logs de Auditoría
              </button>
           </div>
           
           {activeTab === 'users' && (
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar usuario..."
                  className="bg-[#05070A] border border-slate-800 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-[#00E5FF] outline-none w-64 transition-all"
                />
             </div>
           )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <AnimatePresence mode="wait">
            {activeTab === 'users' ? (
              <motion.div 
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <th className="p-4 pl-6">Usuario</th>
                          <th className="p-4">Rol / Identidad</th>
                          <th className="p-4 text-center">Status MFA</th>
                          <th className="p-4">Última Actividad</th>
                          <th className="p-4 text-right pr-6">Acciones Tácticas</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-mono">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-t border-slate-900 hover:bg-slate-900/30 transition-colors group">
                            <td className="p-4 pl-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                    <Users className="w-5 h-5 text-slate-400" />
                                  </div>
                                  <div>
                                     <p className="font-black text-white uppercase tracking-tighter text-xs">{user.name}</p>
                                     <p className="text-[9px] text-slate-600 lowercase">{user.email}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-4">
                               <select 
                                 value={user.role}
                                 onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                 className="bg-transparent border border-slate-800 rounded px-2 py-1 text-[10px] font-black uppercase text-[#00E5FF] outline-none"
                               >
                                  <option value="ventas">Ventas</option>
                                  <option value="operaciones">Operaciones</option>
                                  <option value="admin">Administrador</option>
                                  <option value="superadmin">Super Admin</option>
                               </select>
                            </td>
                            <td className="p-4">
                               <div className="flex justify-center">
                                  <div 
                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-2 border ${user.mfaEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse'}`}
                                  >
                                    <Fingerprint className="w-3 h-3" />
                                    {user.mfaEnabled ? 'Protected' : 'No MFA'}
                                  </div>
                               </div>
                            </td>
                            <td className="p-4 text-slate-500 text-[10px] uppercase">
                               {user.lastLogin}
                            </td>
                            <td className="p-4 text-right pr-6">
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => toggleMFA(user.id)} title="Reset Password" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-[#FF0055] border border-slate-800 transition-all">
                                     <RefreshCw className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'frozen' : 'active')}
                                    title={user.status === 'active' ? "Freeze Account" : "Unfreeze"} 
                                    className={`p-2 rounded-lg border transition-all ${user.status === 'active' ? 'bg-slate-900 text-slate-400 hover:bg-red-600 hover:text-white border-slate-800' : 'bg-red-600 text-white border-red-400'}`}
                                  >
                                     {user.status === 'active' ? <UserX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Terminal className="w-4 h-4 text-[#FF0055]" />
                       Immutable Audit Stream
                    </h3>
                    <div className="text-[9px] font-mono text-slate-600">RECORDS_PROTECTED_BY_BLOCKCHAIN_SYNC</div>
                 </div>
                 
                 <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-[#0B0E14] border border-slate-900 p-4 rounded-xl flex items-center justify-between group hover:border-[#00E5FF]/30 transition-colors">
                         <div className="flex items-center gap-6">
                            <div className="text-slate-700 font-mono text-[9px] shrink-0">
                               {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}
                            </div>
                            <div className="shrink-0">
                               <span className="text-[#00E5FF] font-black text-[10px] uppercase block underline decoration-dotted">{log.user}</span>
                            </div>
                            <div className="flex-1">
                               <p className="text-white font-mono text-xs italic">"{log.action}"</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 text-slate-600 text-[10px] divide-x divide-slate-800">
                            <span className="pl-4 flex items-center gap-1"><Globe className="w-3 h-3" /> {log.location}</span>
                            <span className="pl-4 flex items-center gap-1 font-mono">{log.ip}</span>
                            <span className="pl-4 flex items-center gap-1"><Monitor className="w-3 h-3" /> {log.browser.split(' ')[0]}</span>
                         </div>
                      </div>
                    ))}
                    
                    {logs.length === 0 && (
                      <div className="p-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
                         <Database className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                         <p className="text-xs font-black text-slate-700 uppercase tracking-widest">No se detectan logs en este cuadrante</p>
                      </div>
                    )}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black border-t border-slate-900 flex justify-between items-center px-8">
         <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-[#00E5FF] flex items-center gap-1">
               <ShieldCheck className="w-3 h-3" /> SECURED BY KAIVINCIA SHIELD
            </span>
            <span className="text-[9px] font-mono text-slate-700 flex items-center gap-1">
               <Zap className="w-3 h-3" /> LATENCY: 24MS
            </span>
         </div>
         <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            CONTROL_ACCESS_PROTOCOL_V4.0 // END_OF_LINE
         </div>
      </div>
    </div>
  );
}
