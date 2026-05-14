import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { CheckCircle2, Circle, Plus, Calendar as CalendarIcon, List, Users, X, Clock, AlertTriangle, PlayCircle, ShieldAlert } from 'lucide-react';
import { format, parseISO, isSameDay, isBefore, isAfter, addDays, startOfDay, differenceInDays } from 'date-fns';

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: auth.currentUser?.uid || '',
    projectId: '',
    priority: 'Media' as 'Baja' | 'Media' | 'Alta'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'Todas' | 'Alta' | 'Media' | 'Baja'>('Todas');
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; task: any } | null>(null);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, task });
  };

  useEffect(() => {
    // Fetch Tasks
    const qTasks = query(collection(db, 'tasks'), orderBy('priority', 'desc'), orderBy('dueDate', 'asc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
      setLoading(false);
    });

    // Fetch Users for assignment
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    // Fetch Projects
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'projects'));

    // Fetch Clients
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

    return () => {
      unsubTasks();
      unsubUsers();
      unsubProjects();
      unsubClients();
    };
  }, []);

  const hasMora = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
    const linkedClient = clients.find(c => c.id === project.clientId || c.name === project.client);
    return linkedClient && linkedClient.status !== 'Activo' && (Number(linkedClient.amount) || 0) > 0;
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!newTask.title.trim()) errors.title = 'El título es obligatorio';
    if (!newTask.dueDate) errors.dueDate = 'La fecha de vencimiento es obligatoria';
    if (!newTask.projectId) errors.projectId = 'Debe seleccionar un proyecto';

    const selectedDate = parseISO(newTask.dueDate);
    if (!newTask.dueDate || isNaN(selectedDate.getTime())) {
      errors.dueDate = 'Fecha de vencimiento inválida';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (hasMora(newTask.projectId)) {
      setFormErrors({ projectId: 'No se pueden crear tareas para proyectos con mora activa.' });
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        dueDate: new Date(newTask.dueDate).toISOString(), 
        status: 'pending',
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormErrors({});
      setNewTask({ 
        title: '', 
        description: '', 
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: auth.currentUser?.uid || '',
        projectId: '',
        priority: 'Media'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleDragStart = (task: any) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newPriority: 'Alta' | 'Media' | 'Baja') => {
    if (!draggedTask || draggedTask.priority === newPriority) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'tasks', draggedTask.id), {
        priority: newPriority
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${draggedTask.id}`);
    } finally {
      setDraggedTask(null);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const priorityMatch = filterPriority === 'Todas' || t.priority === filterPriority;
    return priorityMatch;
  });

  const tasksByPriority = {
    Alta: filteredTasks.filter(t => t.priority === 'Alta'),
    Media: filteredTasks.filter(t => t.priority === 'Media'),
    Baja: filteredTasks.filter(t => t.priority === 'Baja')
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    let newStatus = 'pending';
    if (currentStatus === 'pending') newStatus = 'in-progress';
    else if (currentStatus === 'in-progress') newStatus = 'completed';
    else if (currentStatus === 'completed') newStatus = 'pending';

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const getUserName = (uid: string) => {
    const user = users.find(u => u.id === uid);
    return user ? user.name || user.email : 'Usuario Desconocido';
  };

  const getProjectName = (projectId: string) => {
    const pj = projects.find(p => p.id === projectId);
    return pj ? pj.name : 'Sin Proyecto';
  };

  // Generate simple calendar days for the current month
  const today = startOfDay(new Date());
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => new Date(currentYear, currentMonth, i + 1));

  // Compute Notifications/Reminders
  const myTasks = tasks.filter(t => t.assignedTo === auth.currentUser?.uid && t.status !== 'completed');
  const overdueTasks = myTasks.filter(t => {
    if (!t.dueDate) return false;
    try {
      return isBefore(parseISO(t.dueDate), today);
    } catch {
      return false;
    }
  });
  const upcomingTasks = myTasks.filter(t => {
    if (!t.dueDate) return false;
    try {
      const date = parseISO(t.dueDate);
      return !isBefore(date, today) && isBefore(date, addDays(today, 3));
    } catch {
      return false;
    }
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tareas...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tareas y Calendario Colaborativo</h2>
          <p className="text-sm text-gray-500 mt-1">Gestiona progreso, fechas límite y recordatorios</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-1 flex">
            {['Todas', 'Alta', 'Media', 'Baja'].map((p: any) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
                  filterPriority === p 
                    ? 'bg-gray-900 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="w-px h-8 bg-gray-200 self-center"></div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-1 flex">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" /> Lista
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarIcon className="w-4 h-4" /> Calendario
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#00F0FF] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#00BFFF] font-black uppercase tracking-widest text-xs shadow-lg shadow-yellow-900/10"
          >
            <Plus className="h-4 w-4" /> Nueva Tarea
          </button>
        </div>
      </div>

      {/* Recordatorios (Centro de Notificaciones en App) */}
      {(overdueTasks.length > 0 || upcomingTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueTasks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full mt-1 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-red-900 leading-none">Tareas Vencidas</h4>
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{overdueTasks.length} alertas</span>
                </div>
                <p className="text-xs text-red-700 mt-1">Tienes tareas que requieren tu atención inmediata.</p>
                <div className="mt-3 space-y-2">
                  {overdueTasks.map(t => {
                    const daysDelayed = differenceInDays(today, parseISO(t.dueDate));
                    return (
                      <div key={t.id} className="text-sm bg-white border border-red-100 p-2.5 rounded-lg flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-red-900 font-bold truncate max-w-[200px]">{t.title}</span>
                          <span className="text-[10px] text-red-600 uppercase font-black tracking-wider">
                            Venció el {format(parseISO(t.dueDate), 'dd MMM yyyy')}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                          {daysDelayed} {daysDelayed === 1 ? 'días' : 'días'} de retraso
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {upcomingTasks.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full mt-1">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 leading-none">Próximos Vencimientos</h4>
                <p className="text-xs text-blue-700 mt-1">Tienes {upcomingTasks.length} tarea(s) que vencen en los próximos 3 días.</p>
                <div className="mt-2 space-y-1">
                  {upcomingTasks.slice(0, 2).map(t => (
                    <div key={t.id} className="text-sm text-blue-800 font-medium truncate">• {t.title}</div>
                  ))}
                  {upcomingTasks.length > 2 && <div className="text-xs text-blue-600 italic">Y {upcomingTasks.length - 2} más...</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['Alta', 'Media', 'Baja'] as const).map(priority => (
            <div 
              key={priority}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(priority)}
              className={`flex flex-col gap-4 p-4 rounded-3xl min-h-[500px] transition-all ${
                draggedTask ? 'bg-gray-100/50 border-2 border-dashed border-gray-200' : 'bg-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    priority === 'Alta' ? 'bg-red-500' : priority === 'Media' ? 'bg-[#00F0FF]' : 'bg-blue-500'
                  }`} />
                  <h3 className="font-black text-gray-900 uppercase tracking-[0.1em] text-sm">{priority}</h3>
                </div>
                <span className="text-[10px] font-black text-gray-400 bg-white border border-gray-100 px-2.5 py-1 rounded-full shadow-sm">
                  {tasksByPriority[priority].length}
                </span>
              </div>

              <div className="flex-1 space-y-4">
                {tasksByPriority[priority].map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onContextMenu={(e) => handleContextMenu(e, task)}
                    className={`p-5 rounded-2xl shadow-sm border transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                      draggedTask?.id === task.id ? 'opacity-40 grayscale scale-95' : 'hover:shadow-xl'
                    } ${
                      task.status === 'completed' 
                        ? 'border-green-300 bg-green-50' 
                        : task.status === 'in-progress'
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex items-start gap-3 pl-2">
                      <button 
                        onClick={() => toggleTaskStatus(task.id, task.status)}
                        className="mt-0.5 flex-shrink-0 relative group"
                        title="Clic para cambiar estado"
                      >
                        {task.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {task.status === 'in-progress' && <PlayCircle className="h-5 w-5 text-blue-500" />}
                        {task.status === 'pending' && <Circle className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-bold transition-all uppercase leading-tight ${task.status === 'completed' ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                        </div>
                        
                        <p className={`text-[10px] font-black uppercase text-[#00F0FF] mt-1 ${task.status === 'completed' ? 'opacity-50' : ''}`}>
                          {getProjectName(task.projectId)}
                        </p>

                        {task.description && (
                          <p className={`text-[10px] line-clamp-2 mt-1 italic ${task.status === 'completed' ? 'text-gray-300' : 'text-gray-500'}`}>
                            {task.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-col gap-2">
                          <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                            task.status !== 'completed' && task.dueDate && isBefore(parseISO(task.dueDate), today) ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            <CalendarIcon className="w-3.5 h-3.5" /> VENCE: {task.dueDate ? format(parseISO(task.dueDate), 'dd/MM/yyyy') : 'SIN FECHA'}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                              <Users className="w-3 h-3" /> {getUserName(task.assignedTo)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] ${
                              task.status === 'in-progress' ? 'bg-blue-50 text-blue-600' : 
                              task.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasksByPriority[priority].length === 0 && !draggedTask && (
                  <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-50/30">
                    <CheckCircle2 className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Prioridad libre</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[100px] p-2"></div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map(date => {
              const dayTasks = tasks.filter(t => isSameDay(parseISO(t.dueDate), date));
              const isToday = isSameDay(date, today);
              
              return (
                <div key={date.toISOString()} className={`bg-white min-h-[120px] p-2 border-t border-gray-100 transition-colors hover:bg-gray-50 ${isToday ? 'bg-blue-50/20' : ''}`}>
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-500'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id} 
                        className={`text-[10px] p-1.5 rounded truncate border font-medium cursor-pointer ${
                          task.status === 'completed' 
                            ? 'bg-green-50 border-green-200 text-green-700 line-through opacity-70' 
                            : task.status === 'in-progress'
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                        title={`${task.title} - Asignado a: ${getUserName(task.assignedTo)}`}
                        onClick={() => toggleTaskStatus(task.id, task.status)}
                      >
                        {task.status === 'in-progress' && '▶ '}
                        {task.status === 'completed' && '✓ '}
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs font-medium text-gray-500 justify-end items-center">
            <span className="text-gray-400 mr-2">Leyenda de Estados:</span>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div> Pendiente</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div> En Proceso</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div> Completadas</div>
          </div>
        </div>
      )}

      {/* Modal Nueva Tarea */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nueva Tarea Asignable</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {newTask.projectId && hasMora(newTask.projectId) && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 shadow-inner">
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Bloqueo por Cobranza (Mora)</h4>
                  <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                    No puedes registrar nuevas tareas para este proyecto. El cliente asociado presenta facturas vencidas. Por favor, remite el caso al Project Manager o al área de Finanzas.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Título</label>
                <input 
                  type="text" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                  placeholder="Ej. Preparar reporte semanal" 
                  className={`w-full bg-gray-50 rounded-xl border ${formErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-gray-900'} focus:border-gray-900 focus:ring-1 p-3 text-sm outline-none transition-all`} 
                  disabled={hasMora(newTask.projectId)}
                />
                {formErrors.title && <p className="text-[10px] text-red-600 font-bold mt-1 px-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Proyecto</label>
                <select 
                  value={newTask.projectId} 
                  onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                  className={`w-full bg-gray-50 rounded-xl border ${formErrors.projectId ? 'border-red-500' : 'border-gray-200'} focus:border-gray-900 focus:ring-1 p-3 text-sm outline-none bg-white transition-all`}
                >
                  <option value="">Seleccione un proyecto...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {formErrors.projectId && <p className="text-[10px] text-red-600 font-bold mt-1 px-1">{formErrors.projectId}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Vencimiento</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate} 
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})} 
                    className={`w-full bg-gray-50 rounded-xl border ${formErrors.dueDate ? 'border-red-500' : 'border-gray-200'} focus:border-gray-900 focus:ring-1 p-3 text-sm outline-none bg-white transition-all`} 
                    disabled={hasMora(newTask.projectId)}
                  />
                  {formErrors.dueDate && <p className="text-[10px] text-red-600 font-bold mt-1 px-1">{formErrors.dueDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Prioridad</label>
                  <select 
                    value={newTask.priority} 
                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full bg-gray-50 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 p-3 text-sm outline-none bg-white transition-all"
                    disabled={hasMora(newTask.projectId)}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Asignar a</label>
                <select 
                  value={newTask.assignedTo} 
                  onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full bg-gray-50 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 p-3 text-sm outline-none bg-white transition-all"
                  disabled={hasMora(newTask.projectId)}
                >
                  <option value={auth.currentUser?.uid || ''}>Yo mismo</option>
                  {users.filter(u => u.id !== auth.currentUser?.uid).map(user => (
                    <option key={user.id} value={user.id}>{user.name || user.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Descripción</label>
                <textarea 
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})} 
                  placeholder="Detalles clave sobre esta tarea..." 
                  className="w-full bg-gray-50 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 p-3 text-sm outline-none transition-all" 
                  rows={3} 
                  disabled={hasMora(newTask.projectId)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  className={`px-8 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${
                    hasMora(newTask.projectId) ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-gray-900 hover:bg-black shadow-gray-200 active:scale-95'
                  }`}
                  disabled={hasMora(newTask.projectId)}
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-white border border-gray-200 shadow-2xl rounded-xl py-2 min-w-[160px] overflow-hidden"
          style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100 flex flex-col">
            <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Acciones RÁPIDAS</span>
            <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{contextMenu.task.title}</span>
          </div>
          <button 
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={() => {
               toggleTaskStatus(contextMenu.task.id, contextMenu.task.status);
               setContextMenu(null);
            }}
          >
            {contextMenu.task.status === 'completed' ? <PlayCircle className="w-4 h-4 text-blue-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
            {contextMenu.task.status === 'completed' ? 'Marcar En Proceso' : 'Marcar Completada'}
          </button>
          <button 
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
            onClick={async () => {
               // Only for simple demo, ideally we prompt for confirmation
               try {
                 const { deleteDoc } = await import('firebase/firestore');
                 await deleteDoc(doc(db, 'tasks', contextMenu.task.id));
                 setContextMenu(null);
               } catch (e) {
                 console.error(e);
               }
            }}
          >
            <X className="w-4 h-4" /> Eliminar Tarea
          </button>
        </div>
      )}
    </div>
  );
}
