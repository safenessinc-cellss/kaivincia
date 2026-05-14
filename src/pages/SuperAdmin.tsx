import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  ShieldCheck, XCircle, ShieldAlert, Activity, Users, 
  Key, UserPlus, Eye, Lock, Globe, AlertTriangle, CheckCircle2,
  Search, Filter, MoreVertical, X, Mail
} from 'lucide-react';

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('none');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => unsubscribe();
  }, []);

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      // Log audit
      await addDoc(collection(db, 'audit_logs'), {
        userId: 'system',
        action: 'UPDATE_USER_STATUS',
        resourceType: 'User',
        resourceId: userId,
        details: JSON.stringify({ newStatus: status }),
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role });
      // Log audit
      await addDoc(collection(db, 'audit_logs'), {
        userId: 'system',
        action: 'UPDATE_USER_ROLE',
        resourceType: 'User',
        resourceId: userId,
        details: JSON.stringify({ newRole: role }),
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulation of sending an invite
      alert(`Invitación enviada a ${inviteEmail} con rol ${inviteRole}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando centro de seguridad...</div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Centro de Control de Seguridad (CISO)</h2>
          <p className="text-sm text-gray-500 mt-1">Gestión de accesos, roles (RBAC) y auditoría del sistema.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="bg-[#00F0FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Invitar Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'users', label: 'Gestión de Usuarios', icon: Users },
            { id: 'roles', label: 'Matriz de Permisos (RBAC)', icon: Key },
            { id: 'audit', label: 'Logs de Auditoría', icon: Activity },
            { id: 'alerts', label: 'Alertas de Seguridad', icon: ShieldAlert },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#00F0FF] text-[#00F0FF] bg-cyan-500/10/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Buscar usuario..." 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                  />
                </div>
                <button className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" /> Filtros
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Último Login</th>
                      <th className="px-6 py-3">Seguridad (2FA)</th>
                      <th className="px-6 py-3 text-right">Acciones de Poder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="bg-white hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                              {user.name?.charAt(0) || user.email?.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{user.name || 'Usuario'}</div>
                              <div className="text-gray-500 text-xs">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={user.role || 'none'}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className={`text-sm border-gray-300 rounded-md shadow-sm focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white ${
                                (user.role === 'none' || !user.role) ? 'border-red-300 text-red-500 font-bold' : ''
                              }`}
                            >
                              <option value="none">⚠️ Sin Rol</option>
                              <option value="user">Usuario Básico</option>
                              <option value="alumno">Alumno</option>
                              <option value="collaborator">Colaborador</option>
                              <option value="gestor">Gestor de Operaciones</option>
                              <option value="ceo">CEO / Director</option>
                              <option value="rrhh">Recursos Humanos</option>
                              <option value="sales">Ventas</option>
                              <option value="support">Soporte</option>
                              <option value="tutor">Tutor</option>
                              <option value="admin">Administrador</option>
                              <option value="superadmin">⚡ SuperAdmin</option>
                            </select>
                            { (user.role === 'none' || !user.role) && (
                              <div className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.status || 'pending'}
                            onChange={(e) => updateUserStatus(user.id, e.target.value)}
                            className={`text-sm border-0 rounded-full px-2 py-1 font-semibold ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' : 
                              user.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <option value="active">Activo</option>
                            <option value="pending">Pendiente</option>
                            <option value="suspended">Suspendido</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-900 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-400" /> {user.lastLoginIp || '192.168.1.1'}
                          </div>
                          <div className="text-xs text-gray-500">{user.lastLoginCountry || 'México'}</div>
                        </td>
                        <td className="px-6 py-4">
                          {user.twoFactorEnabled ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                              <CheckCircle2 className="w-3 h-3" /> 2FA Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit">
                              <AlertTriangle className="w-3 h-3" /> 2FA Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button title="Impersonar (Entrar como)" className="p-1 text-gray-400 hover:text-[#00F0FF] transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button title="Resetear Password" className="p-1 text-gray-400 hover:text-[#00F0FF] transition-colors">
                              <Lock className="w-4 h-4" />
                            </button>
                            <button title="Ver Logs" className="p-1 text-gray-400 hover:text-[#00F0FF] transition-colors">
                              <Activity className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RBAC TAB */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Matriz de Permisos (RBAC)</h3>
                <p className="text-sm text-gray-500 mb-6">Configura qué módulos y acciones puede realizar cada rol en el sistema.</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 border-r border-gray-200">Módulo / Permiso</th>
                        <th className="px-4 py-3 text-center border-r border-gray-200">SuperAdmin</th>
                        <th className="px-4 py-3 text-center border-r border-gray-200">Admin</th>
                        <th className="px-4 py-3 text-center border-r border-gray-200">Ventas</th>
                        <th className="px-4 py-3 text-center border-r border-gray-200">Soporte</th>
                        <th className="px-4 py-3 text-center">Tutor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[
                        { name: 'Ver Dashboard Financiero', sa: true, a: true, v: false, s: false, t: false },
                        { name: 'Ver Valor de Contratos', sa: true, a: true, v: false, s: false, t: false },
                        { name: 'Exportar Base de Datos', sa: true, a: false, v: false, s: false, t: false },
                        { name: 'Gestionar Clientes B2B', sa: true, a: true, v: true, s: false, t: false },
                        { name: 'Gestionar Alumnos', sa: true, a: true, v: true, s: true, t: true },
                        { name: 'Configurar VoIP', sa: true, a: true, v: false, s: false, t: false },
                        { name: 'Eliminar Registros', sa: true, a: false, v: false, s: false, t: false },
                      ].map((perm, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200">{perm.name}</td>
                          <td className="px-4 py-3 text-center border-r border-gray-200">{perm.sa ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-300 mx-auto" />}</td>
                          <td className="px-4 py-3 text-center border-r border-gray-200">{perm.a ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-300 mx-auto" />}</td>
                          <td className="px-4 py-3 text-center border-r border-gray-200">{perm.v ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-300 mx-auto" />}</td>
                          <td className="px-4 py-3 text-center border-r border-gray-200">{perm.s ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-300 mx-auto" />}</td>
                          <td className="px-4 py-3 text-center">{perm.t ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-300 mx-auto" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de Auditoría</h3>
              <div className="space-y-4">
                {[
                  { time: 'Hace 5 min', user: 'admin@kaivincia.com', action: 'Cambió estado de cliente "TechSolutions" de Activo a Pausado', ip: '192.168.1.45' },
                  { time: 'Hace 1 hora', user: 'ventas@kaivincia.com', action: 'Exportó reporte de alumnos (Limitado a 50 filas)', ip: '189.200.1.2' },
                  { time: 'Hace 3 horas', user: 'safeness.c.a@gmail.com', action: 'Asignó rol "Ventas" a nuevo usuario', ip: '10.0.0.1' },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <Activity className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{log.user}</span>
                        <span>•</span>
                        <span>{log.time}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {log.ip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Alertas de Seguridad y Prevención de Fugas (DLP)</h3>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 bg-red-50 rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900">Intento de Exportación Masiva</h4>
                    <p className="text-sm text-red-700 mt-1">El usuario "ventas_jr@kaivincia.com" intentó descargar el 100% de la base de datos de clientes. La acción fue bloqueada por la regla DLP-01.</p>
                    <p className="text-xs text-red-500 mt-2 font-medium">Hace 2 horas • IP: 189.200.1.5</p>
                  </div>
                  <button className="ml-auto px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50">
                    Investigar
                  </button>
                </div>
                
                <div className="p-4 border border-yellow-200 bg-cyan-500/10 rounded-xl flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-900">Inicio de Sesión Inusual</h4>
                    <p className="text-sm text-yellow-700 mt-1">Se detectó un inicio de sesión exitoso desde un país no habitual (Rusia) para el usuario "soporte@kaivincia.com".</p>
                    <p className="text-xs text-yellow-600 mt-2 font-medium">Hace 5 horas • IP: 45.12.33.1</p>
                  </div>
                  <button className="ml-auto px-3 py-1.5 bg-white border border-yellow-200 text-yellow-700 text-xs font-bold rounded-lg hover:bg-yellow-100">
                    Forzar 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Invitar Nuevo Miembro</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleInviteUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="ejemplo@kaivincia.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00F0FF] focus:border-[#00F0FF]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Rol Inicial</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-[#00F0FF] focus:border-[#00F0FF] bg-white"
                >
                  <option value="none">Sin Rol (Activación Manual)</option>
                  <option value="user">Usuario Básico</option>
                  <option value="alumno">Alumno (Solo Academia)</option>
                  <option value="sales">Ventas</option>
                  <option value="support">Soporte</option>
                  <option value="tutor">Tutor Académico</option>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Los usuarios invitados con "Sin Rol" no podrán acceder al dashboard hasta que un SuperAdmin les asigne una función específica.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[#00F0FF] text-white rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2"
                >
                  Enviar Invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
