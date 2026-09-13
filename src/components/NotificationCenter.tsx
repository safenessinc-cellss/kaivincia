import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Bell, Clock, AlertTriangle, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { format, isSameDay, parseISO, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const today = new Date();

    // Listen to Tasks
    const qTasks = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', uid),
      where('status', '!=', 'completed'),
      orderBy('createdAt', 'desc')
    );

    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const taskNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        const dueDate = data.dueDate ? parseISO(data.dueDate) : null;
        const isToday = dueDate ? isSameDay(dueDate, today) : false;
        
        // Notification for new assignment (created in last 24h)
        const createdAt = data.createdAt ? parseISO(data.createdAt) : new Date();
        const isNewAssignment = (today.getTime() - createdAt.getTime() < 24 * 60 * 60 * 1000);

        if (isToday) {
          return {
            id: doc.id,
            type: 'task_today',
            title: 'Tarea para Hoy',
            message: data.title,
            priority: 'high',
            timestamp: data.createdAt || new Date().toISOString(),
            path: '/crm/tasks'
          };
        }

        if (isNewAssignment) {
          return {
            id: doc.id,
            type: 'task_new',
            title: 'Nueva Tarea Asignada',
            message: data.title,
            priority: 'medium',
            timestamp: data.createdAt || new Date().toISOString(),
            path: '/crm/tasks'
          };
        }
        return null;
      }).filter(Boolean);

      updateNotifications('task', taskNotifications as any[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    // Listen to Messages (Last 10 messages)
    const qMessages = query(
      collection(db, 'chat_messages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const messageNotifications = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Filter: Not own messages AND recently created (last 30 mins for notifications)
          const createdAt = data.createdAt ? parseISO(data.createdAt) : new Date();
          const isRecent = (today.getTime() - createdAt.getTime() < 30 * 60 * 1000);
          return data.senderId !== uid && isRecent;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'message',
            title: 'Mensaje Nuevo',
            message: data.text,
            priority: 'low',
            timestamp: data.createdAt,
            path: '/crm/chat'
          };
        });
      
      updateNotifications('message', messageNotifications);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'chat_messages'));

    const updateNotifications = (type: string, newNotifs: any[]) => {
      setNotifications(prev => {
        const others = prev.filter(n => n.type !== type);
        const combined = [...newNotifs, ...others];
        // Deduplicate by ID
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    };

    return () => {
      unsubTasks();
      unsubMessages();
    };
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-[#00F0FF]' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00F0FF]" /> Centro de Alertas
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No tienes alertas pendientes</p>
                  <p className="text-[10px] text-gray-400 mt-1">¡Buen trabajo manteniendo todo al día!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        navigate(notif.path);
                        setIsOpen(false);
                      }}
                      className="w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`mt-0.5 rounded-full p-1.5 ${
                        notif.priority === 'high' ? 'bg-red-100 text-red-600' : 
                        notif.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {notif.priority === 'high' ? <AlertTriangle className="w-4 h-4" /> : 
                         notif.type === 'message' ? <MessageSquare className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            notif.priority === 'high' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {format(new Date(notif.timestamp), 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium leading-tight truncate">
                          {notif.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => navigate('/crm/tasks')}
                className="w-full text-center text-xs font-bold text-[#00F0FF] hover:text-yellow-700 transition-colors"
              >
                Ver todas las tareas
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
