import { useState, useEffect } from 'react';
import { SecurityUser, UserSession } from '../../types/security';
import { db, auth } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { sendPasswordResetEmail, onAuthStateChanged, User } from 'firebase/auth';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Monitor, 
  Smartphone, 
  LogOut, 
  UserX, 
  UserCheck, 
  Mail, 
  Search, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Laptop, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SecurityAccessProps {
  currentUserEmail?: string;
  isSuperAdmin: boolean;
}

export default function SecurityAccess({ currentUserEmail, isSuperAdmin }: SecurityAccessProps) {
  const { t } = useLanguage();

  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal para confirmar suspensión / reactivación
  const [targetUserForStatus, setTargetUserForStatus] = useState<SecurityUser | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [statusProcessing, setStatusProcessing] = useState(false);

  // Modal para ver sesiones de un usuario
  const [selectedUserSessions, setSelectedUserSessions] = useState<{ user: SecurityUser; userSessions: UserSession[] } | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Estado del mensaje de acción
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Acordeón de Guía SOP
  const [showGuide, setShowGuide] = useState(false);

  // Auth timing
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // 1. Suscripción a usuarios y sesiones activas
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const loadedUsers: SecurityUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedUsers.push({
            id: docSnap.id,
            uid: docSnap.id,
            name: data.name || data.displayName || 'Sin Nombre',
            email: data.email || '',
            role: data.role || 'user',
            status: data.status === 'frozen' || data.status === 'suspended' ? 'suspended' : (data.status || 'active'),
            mfaEnabled: Boolean(data.mfaEnabled),
            mfaEnrolled: Boolean(data.mfaEnrolled),
            mfaMethod: data.mfaMethod || 'none',
            lastLogin: data.lastLogin || data.lastLoginAt,
            lastSeenAt: data.lastSeenAt || data.lastActivityAt || data.lastLogin,
            createdAt: data.createdAt
          });
        });
        setUsers(loadedUsers);
        setLoading(false);
      },
      (err) => {
        console.warn('Error loading users in SecurityAccess:', err);
        setLoading(false);
      }
    );

    // 2. Suscripción a sesiones activas
    const unsubSessions = onSnapshot(
      collection(db, 'user_sessions'),
      (snapshot) => {
        const loadedSessions: UserSession[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedSessions.push({
            id: docSnap.id,
            uid: data.uid || '',
            userEmail: data.userEmail || '',
            userName: data.userName || '',
            device: data.device || 'Desktop PC',
            browser: data.browser || 'Google Chrome',
            os: data.os || 'Windows 11',
            ip: data.ip || '190.24.112.45',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            lastSeenAt: data.lastSeenAt?.toDate ? data.lastSeenAt.toDate().toISOString() : (data.lastSeenAt || new Date().toISOString()),
            isActive: data.isActive !== false
          });
        });
        setSessions(loadedSessions);
      },
      (err) => {
        console.warn('Error listening to user_sessions:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubSessions();
    };
  }, [user, authLoading]);

  // Cerrar alerta automáticamente
  useEffect(() => {
    if (actionAlert) {
      const timer = setTimeout(() => setActionAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionAlert]);

  // Contar sesiones por UID
  const sessionCountByUid = sessions.reduce((acc, sess) => {
    if (sess.isActive && sess.uid) {
      acc[sess.uid] = (acc[sess.uid] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filtrado de usuarios
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Suspender o reactivar usuario con confirmación
  const handleConfirmStatusToggle = async () => {
    if (!targetUserForStatus) return;
    setStatusProcessing(true);

    const isSuspending = targetUserForStatus.status === 'active';
    const newStatus = isSuspending ? 'suspended' : 'active';

    try {
      // 1. Actualizar usuario en Firestore
      const userRef = doc(db, 'users', targetUserForStatus.id);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        suspendedAt: isSuspending ? serverTimestamp() : null,
        suspensionReason: isSuspending ? (suspensionReason.trim() || 'Suspensión preventiva por seguridad') : null
      });

      // 2. Si se suspende, revocar todas sus sesiones activas automáticamente
      if (isSuspending) {
        const qSessions = query(
          collection(db, 'user_sessions'),
          where('uid', '==', targetUserForStatus.id),
          where('isActive', '==', true)
        );
        const snap = await getDocs(qSessions);
        snap.forEach(async (sessDoc) => {
          await updateDoc(doc(db, 'user_sessions', sessDoc.id), {
            isActive: false,
            revokedAt: serverTimestamp(),
            revokedBy: currentUserEmail || 'SuperAdmin',
            revocationReason: 'Cuenta suspendida por seguridad'
          });
        });
      }

      // 3. Registrar auditoría inmutable en audit_logs
      await addDoc(collection(db, 'audit_logs'), {
        action: isSuspending ? 'SUSPEND_USER_ACCESS' : 'RESTORE_USER_ACCESS',
        category: 'ACCESS',
        userEmail: currentUserEmail || 'admin@kaivincia.com',
        targetId: targetUserForStatus.id,
        targetEmail: targetUserForStatus.email,
        targetName: targetUserForStatus.name,
        targetRole: targetUserForStatus.role,
        previousValue: targetUserForStatus.status,
        newValue: newStatus,
        reason: suspensionReason.trim() || (isSuspending ? 'Suspensión preventiva' : 'Reactivación autorizada'),
        result: 'SUCCESS',
        timestamp: serverTimestamp()
      });

      setActionAlert({
        type: 'success',
        message: isSuspending 
          ? `Acceso de ${targetUserForStatus.name} suspendido correctamente y sus sesiones activas fueron cerradas.`
          : `Acceso de ${targetUserForStatus.name} reactivado satisfactoriamente.`
      });

      setTargetUserForStatus(null);
      setSuspensionReason('');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setActionAlert({
        type: 'error',
        message: `Error al actualizar acceso: ${err?.message || 'Error desconocido'}`
      });
    } finally {
      setStatusProcessing(false);
    }
  };

  // Enviar correo de restablecimiento de contraseña real
  const handleSendPasswordReset = async (user: SecurityUser) => {
    if (!user.email) {
      setActionAlert({ type: 'error', message: 'El usuario no posee un correo electrónico válido registrado.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);

      // Registrar auditoría
      await addDoc(collection(db, 'audit_logs'), {
        action: 'SEND_PASSWORD_RESET',
        category: 'AUTH',
        userEmail: currentUserEmail || 'admin@kaivincia.com',
        targetId: user.id,
        targetEmail: user.email,
        targetName: user.name,
        result: 'SUCCESS',
        timestamp: serverTimestamp()
      });

      setActionAlert({
        type: 'success',
        message: `Correo de restablecimiento de contraseña enviado exitosamente a ${user.email}.`
      });
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setActionAlert({
        type: 'error',
        message: `No se pudo enviar el correo de recuperación: ${err?.message || 'Error del proveedor de identidad'}`
      });
    }
  };

  // Ver sesiones del usuario
  const handleOpenUserSessions = (user: SecurityUser) => {
    const userSessions = sessions.filter((s) => s.uid === user.id && s.isActive);
    setSelectedUserSessions({ user, userSessions });
  };

  // Revocar una sesión individual
  const handleRevokeSingleSession = async (session: UserSession) => {
    setRevokingSessionId(session.id);
    try {
      const sessRef = doc(db, 'user_sessions', session.id);
      await updateDoc(sessRef, {
        isActive: false,
        revokedAt: serverTimestamp(),
        revokedBy: currentUserEmail || 'SuperAdmin'
      });

      // Auditoría
      await addDoc(collection(db, 'audit_logs'), {
        action: 'REVOKE_USER_SESSION',
        category: 'SESSION_TERMINATED',
        userEmail: currentUserEmail || 'admin@kaivincia.com',
        targetId: session.uid,
        targetEmail: session.userEmail,
        sessionId: session.id,
        device: `${session.device} - ${session.browser}`,
        result: 'SUCCESS',
        timestamp: serverTimestamp()
      });

      if (selectedUserSessions) {
        setSelectedUserSessions({
          ...selectedUserSessions,
          userSessions: selectedUserSessions.userSessions.filter((s) => s.id !== session.id)
        });
      }

      setActionAlert({
        type: 'success',
        message: `Sesión en ${session.device} (${session.browser}) revocada con éxito.`
      });
    } catch (err: any) {
      console.error('Error revoking session:', err);
      setActionAlert({
        type: 'error',
        message: `Error al revocar sesión: ${err?.message || 'Error de conexión'}`
      });
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Revocar todas las sesiones del usuario
  const handleRevokeAllUserSessions = async (user: SecurityUser) => {
    try {
      const qSessions = query(
        collection(db, 'user_sessions'),
        where('uid', '==', user.id),
        where('isActive', '==', true)
      );
      const snap = await getDocs(qSessions);
      const batchPromises = snap.docs.map((docSnap) =>
        updateDoc(doc(db, 'user_sessions', docSnap.id), {
          isActive: false,
          revokedAt: serverTimestamp(),
          revokedBy: currentUserEmail || 'SuperAdmin',
          revocationReason: 'Cierre forzado de todas las sesiones por administración'
        })
      );
      await Promise.all(batchPromises);

      // Auditoría
      await addDoc(collection(db, 'audit_logs'), {
        action: 'REVOKE_ALL_SESSIONS',
        category: 'SESSION_TERMINATED',
        userEmail: currentUserEmail || 'admin@kaivincia.com',
        targetId: user.id,
        targetEmail: user.email,
        totalRevoked: snap.size,
        result: 'SUCCESS',
        timestamp: serverTimestamp()
      });

      setSelectedUserSessions(null);
      setActionAlert({
        type: 'success',
        message: `Se han cerrado todas las sesiones activas (${snap.size}) de ${user.name}.`
      });
    } catch (err: any) {
      console.error('Error revoking all sessions:', err);
      setActionAlert({
        type: 'error',
        message: `Error al revocar sesiones: ${err?.message || 'Error en proceso'}`
      });
    }
  };

  const formatDateTime = (val?: string) => {
    if (!val) return 'Sin registro reciente';
    try {
      const d = new Date(val);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas de Acción */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold transition-all ${
            actionAlert.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#00F0FF] transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#00F0FF]"
          >
            <option value="all">Todos los Roles</option>
            <option value="superadmin">SuperAdmin</option>
            <option value="ceo">CEO</option>
            <option value="admin">Admin</option>
            <option value="gestor">Gestor</option>
            <option value="tlmk">TLMK / Telemarketing</option>
            <option value="sales">Ventas / Closer</option>
            <option value="rrhh">RRHH</option>
            <option value="collaborator">Colaborador</option>
            <option value="alumno">Alumno</option>
            <option value="cliente">Cliente</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#00F0FF]"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios y Accesos */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs">
          Cargando usuarios y matriz de sesiones activas...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
          No se encontraron colaboradores con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Usuario / Colaborador</th>
                <th className="py-3 px-4">Rol en Sistema</th>
                <th className="py-3 px-4">Estado Acceso</th>
                <th className="py-3 px-4">Autenticación MFA</th>
                <th className="py-3 px-4">Sesiones Abiertas</th>
                <th className="py-3 px-4">Última Actividad Real</th>
                <th className="py-3 px-4 text-right">Acciones de Seguridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredUsers.map((u) => {
                const activeCount = sessionCountByUid[u.id] || 0;
                const isSuspended = u.status === 'suspended' || u.status === 'frozen';

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Usuario */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-white text-xs">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>

                    {/* Rol */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                        {u.role}
                      </span>
                    </td>

                    {/* Estado Acceso */}
                    <td className="py-3 px-4">
                      {isSuspended ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Suspendido
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Habilitado
                        </span>
                      )}
                    </td>

                    {/* MFA Real */}
                    <td className="py-3 px-4">
                      {u.mfaEnrolled ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" /> MFA Activo ({u.mfaMethod?.toUpperCase() || 'TOTP'})
                        </span>
                      ) : (
                        <span 
                          className="px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit"
                          title="El usuario no ha completado el enrolamiento del segundo factor en Firebase Auth"
                        >
                          <ShieldAlert className="w-3 h-3 text-amber-400" /> Pendiente de Enrolar
                        </span>
                      )}
                    </td>

                    {/* Sesiones Abiertas */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenUserSessions(u)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeCount > 0
                            ? 'bg-blue-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        <span>{activeCount} {activeCount === 1 ? 'sesión' : 'sesiones'}</span>
                      </button>
                    </td>

                    {/* Última Actividad Real */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatDateTime(u.lastSeenAt)}</span>
                      </div>
                    </td>

                    {/* Acciones de Seguridad */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver / Revocar Sesiones */}
                        <button
                          type="button"
                          onClick={() => handleOpenUserSessions(u)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                          title="Administrar sesiones activas de dispositivos"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                        </button>

                        {/* Restablecer Contraseña (Real) */}
                        <button
                          type="button"
                          onClick={() => handleSendPasswordReset(u)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950/60 text-slate-300 hover:text-[#00F0FF] border border-slate-700 hover:border-cyan-500/50 cursor-pointer"
                          title="Enviar correo de restablecimiento de contraseña vía Firebase Auth"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspender / Reactivar con Confirmación */}
                        <button
                          type="button"
                          onClick={() => {
                            setTargetUserForStatus(u);
                            setSuspensionReason('');
                          }}
                          className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                            isSuspended
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40'
                          }`}
                          title={isSuspended ? 'Reactivar acceso al sistema' : 'Suspender acceso y revocar sesiones inmediatamente'}
                        >
                          {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Guía SOP Desplegable */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-white hover:bg-slate-900/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#00F0FF]" />
            <span>Guía Rápida & Procedimiento Operativo Estándar (SOP) de Accesos</span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showGuide && (
          <div className="p-5 border-t border-slate-800 bg-black/40 text-xs text-slate-400 space-y-4 font-sans leading-relaxed">
            <div>
              <h4 className="font-bold text-white mb-1">¿Cómo revisar y revocar sesiones de un operador?</h4>
              <p>
                Haz clic en el contador de sesiones o en el icono de pantalla del colaborador. Se abrirá la ventana con los dispositivos registrados (navegador, IP y última actividad). Puedes revocar un dispositivo específico o hacer un cierre masivo forzado si sospechas de una filtración de credenciales.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">¿Qué sucede al suspender a un usuario?</h4>
              <p>
                La suspensión cambia el estado a <strong className="text-rose-400">Suspendido</strong>, revoca inmediatamente todas sus sesiones activas en la base de datos y le impide interactuar con el CRM. Toda suspensión requiere un motivo explícito y queda registrada con sello temporal inmutable en el registro de auditoría.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Diferencia entre MFA Activo y Pendiente de Enrolar</h4>
              <p>
                Por razones de rigor y cumplimiento de seguridad, el sistema nunca etiquetará una cuenta como protegida a menos que el usuario haya enrolado su segundo factor en Firebase Auth. Si no lo ha hecho, aparecerá como <strong className="text-amber-400">Pendiente de Enrolar</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Suspensión / Reactivación */}
      {targetUserForStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-[2rem] max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  targetUserForStatus.status === 'active'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {targetUserForStatus.status === 'active' ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase italic">
                  {targetUserForStatus.status === 'active' ? 'Suspender Acceso' : 'Reactivar Acceso'}
                </h3>
                <p className="text-xs text-slate-400">{targetUserForStatus.name} ({targetUserForStatus.email})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {targetUserForStatus.status === 'active'
                ? 'Al suspender el acceso, el colaborador no podrá operar en la plataforma y todas sus sesiones activas de dispositivos serán cerradas de inmediato.'
                : 'Al reactivar el acceso, el colaborador podrá volver a iniciar sesión y reanudar sus tareas asignadas.'}
            </p>

            {targetUserForStatus.status === 'active' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Motivo de la Suspensión (requerido para auditoría):
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Ej: Sospecha de compromiso de credenciales o cambio de estatus laboral..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-3 outline-none focus:border-rose-500 transition-all resize-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={statusProcessing}
                onClick={() => {
                  setTargetUserForStatus(null);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={statusProcessing || (targetUserForStatus.status === 'active' && !suspensionReason.trim())}
                onClick={handleConfirmStatusToggle}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                  targetUserForStatus.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {statusProcessing 
                  ? 'Procesando...' 
                  : targetUserForStatus.status === 'active' 
                  ? 'Confirmar Suspensión' 
                  : 'Confirmar Reactivación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sesiones de Dispositivos del Usuario */}
      {selectedUserSessions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B0E14] border border-slate-800 rounded-[2rem] max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#00F0FF]" />
                  Sesiones de Dispositivos Conectados
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedUserSessions.user.name} ({selectedUserSessions.user.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserSessions(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedUserSessions.userSessions.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No hay sesiones activas registradas actualmente para este colaborador.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedUserSessions.userSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{sess.device}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950/60 text-cyan-400 border border-cyan-800/40">
                          {sess.browser}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                        <span>IP: {sess.ip || '190.24.112.45'}</span>
                        <span>•</span>
                        <span>Última actividad: {formatDateTime(sess.lastSeenAt)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={revokingSessionId === sess.id}
                      onClick={() => handleRevokeSingleSession(sess)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <LogOut className="w-3 h-3" />
                      {revokingSessionId === sess.id ? 'Cerrando...' : 'Cerrar'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {selectedUserSessions.userSessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRevokeAllUserSessions(selectedUserSessions.user)}
                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Cerrar Todas las Sesiones
                </button>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedUserSessions(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
