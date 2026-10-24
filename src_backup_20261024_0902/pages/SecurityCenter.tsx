import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Laptop, 
  Users, 
  Activity, 
  FileText, 
  BarChart3, 
  AlertTriangle, 
  Key, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Eye
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import SecurityAccess from '../components/security/SecurityAccess';
import AuditLog from '../components/security/AuditLog';
import OperationsSupervision from '../components/security/OperationsSupervision';

export default function SecurityCenter() {
  const { userData } = useOutletContext<{ userData: any }>();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'security' | 'audit' | 'supervision'>('security');

  // Métricas reales en tiempo real
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [suspendedUsersCount, setSuspendedUsersCount] = useState<number>(0);
  const [mfaEnrolledCount, setMfaEnrolledCount] = useState<number>(0);
  const [recentIncidentsCount, setRecentIncidentsCount] = useState<number>(0);

  const userRole = userData?.role || 'user';
  const isSuperAdmin = userRole === 'superadmin';
  const isAuthorized = ['superadmin', 'admin', 'ceo', 'gestor'].includes(userRole);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAuthorized) return;

    // 1. Conteo de sesiones activas reales
    const qSessions = query(collection(db, 'user_sessions'), where('isActive', '==', true));
    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setActiveSessionsCount(snap.size);
    }, (err) => {
      console.warn('Error fetching active sessions:', err);
    });

    // 2. Conteo y estados de usuarios
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setTotalUsersCount(snap.size);
      let suspended = 0;
      let mfaCount = 0;
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.status === 'suspended' || d.status === 'frozen') suspended++;
        if (d.mfaEnrolled) mfaCount++;
      });
      setSuspendedUsersCount(suspended);
      setMfaEnrolledCount(mfaCount);
    }, (err) => {
      console.warn('Error fetching users stats:', err);
    });

    // 3. Conteo de incidentes en últimas 24h desde audit_logs
    const unsubAudit = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let incidentCount = 0;
      snap.forEach((doc) => {
        const d = doc.data();
        const date = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp || 0);
        if (date > oneDayAgo && (d.result === 'FAILURE' || d.action?.includes('SUSPEND') || d.action?.includes('REVOKE'))) {
          incidentCount++;
        }
      });
      setRecentIncidentsCount(incidentCount);
    });

    return () => {
      unsubSessions();
      unsubUsers();
      unsubAudit();
    };
  }, [user, authLoading, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white uppercase italic tracking-wider mb-2">
          Acceso Restringido (CISO / Security)
        </h2>
        <p className="text-xs text-slate-400 max-w-md font-mono leading-relaxed">
          Se requiere rol de SuperAdmin, Admin, CEO o Gestor para consultar el Centro de Seguridad, Auditoría y Supervisión Operativa.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                Centro de Seguridad & Auditoría
                <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-blue-950/80 text-[#00F0FF] border border-blue-800/80 not-italic">
                  CISO OPERACIONAL
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Control de Sesiones • Trazabilidad Forense • Supervisión Operativa en Tiempo Real
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de Estado del Sistema */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
          <div className="text-[11px] font-mono">
            <span className="text-slate-400">Protección del Ecosistema:</span>{' '}
            <strong className="text-emerald-400">EN LÍNEA</strong>
          </div>
        </div>
      </div>

      {/* Tarjetas de Telemetría Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Sesiones Activas Reales */}
        <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">
              Sesiones Activas
            </span>
            <div className="text-2xl font-black text-[#00F0FF] flex items-baseline gap-2">
              <span>{activeSessionsCount}</span>
              <span className="text-[11px] font-normal text-slate-500">dispositivos</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-1">Concurrencia real en vivo</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-center text-[#00F0FF]">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        {/* Usuarios Habilitados */}
        <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">
              Cuentas de Usuario
            </span>
            <div className="text-2xl font-black text-white flex items-baseline gap-2">
              <span>{totalUsersCount - suspendedUsersCount}</span>
              <span className="text-[11px] font-normal text-slate-500">/ {totalUsersCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-1">
              {suspendedUsersCount > 0 ? (
                <span className="text-rose-400">{suspendedUsersCount} suspendidos</span>
              ) : (
                '100% operativos'
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* 2FA / MFA Enrolado */}
        <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">
              MFA Verificado
            </span>
            <div className="text-2xl font-black text-emerald-400 flex items-baseline gap-2">
              <span>{mfaEnrolledCount}</span>
              <span className="text-[11px] font-normal text-slate-500">
                ({totalUsersCount > 0 ? Math.round((mfaEnrolledCount / totalUsersCount) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-1">Enrolados en Firebase Auth</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Eventos Críticos (24h) */}
        <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-1">
              Eventos Críticos (24h)
            </span>
            <div className="text-2xl font-black text-amber-400">
              {recentIncidentsCount}
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-1">Suspensiones o revocaciones</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Seguridad y Accesos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Auditoría Forense</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supervision')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'supervision'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_20px_rgba(0,240,255,0.25)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Supervisión Operativa</span>
        </button>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div>
        {activeTab === 'security' && (
          <SecurityAccess 
            currentUserEmail={userData?.email}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLog />
        )}

        {activeTab === 'supervision' && (
          <OperationsSupervision />
        )}
      </div>
    </div>
  );
}
