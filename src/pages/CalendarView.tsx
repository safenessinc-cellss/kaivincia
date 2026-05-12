import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { X } from 'lucide-react';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'interaction';
  allDay?: boolean;
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  useEffect(() => {
    // Fetch Tasks
    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const taskEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.dueDate ? new Date(data.dueDate) : new Date();
        return {
          id: doc.id,
          title: `[Tarea] ${data.title}`,
          start: date,
          end: date,
          type: 'task' as const,
          allDay: true
        };
      });

      // Fetch Interactions/Clients
      const unsubscribeClients = onSnapshot(collection(db, 'clients'), (clientSnap) => {
        const clientEvents = clientSnap.docs
          .filter(doc => doc.data().contactDate)
          .map(doc => {
            const data = doc.data();
            const date = new Date(data.contactDate);
            return {
              id: `client-${doc.id}`,
              title: `[Contacto] ${data.name}`,
              start: date,
              end: date,
              type: 'interaction' as const,
              allDay: true
            };
          });

        setEvents([...taskEvents, ...clientEvents]);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

      return () => unsubscribeClients();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    return () => unsubscribeTasks();
  }, []);

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    setSelectedDate(slotInfo.start);
    setIsModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newTask.title) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        description: newTask.description,
        dueDate: selectedDate.toISOString(),
        status: 'pending',
        assignedTo: auth.currentUser?.uid || 'unassigned',
        createdAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewTask({ title: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // blue for tasks
    if (event.type === 'interaction') {
      backgroundColor = '#10b981'; // green for interactions
    }
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          culture="es"
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay eventos en este rango."
          }}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Nueva Tarea para {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  required
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] sm:text-sm p-2 border"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-black bg-[#00F0FF] border border-transparent rounded-md hover:bg-[#00BFFF]"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
