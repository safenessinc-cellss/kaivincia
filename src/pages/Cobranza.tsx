import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { differenceInDays, parseISO } from 'date-fns';
import { Search, Plus, Phone, MessageCircle, Download } from 'lucide-react';

export default function Cobranza() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', product: '', amount: 0, contactDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const clientData = doc.data();
        const daysInArrears = differenceInDays(new Date(), parseISO(clientData.contactDate));
        const amount = Number(clientData.amount) || 0;
        
        let group = 'C';
        let priority = 'Baja';
        let score = 1;
        
        // Lógica de clasificación basada en mora y monto
        if (daysInArrears > 60 || amount > 5000) {
          group = 'A';
          priority = 'Alta';
          score = 3;
        } else if (daysInArrears > 30 || amount > 1000) {
          group = 'B';
          priority = 'Media';
          score = 2;
        } else {
          group = 'C';
          priority = 'Baja';
          score = 1;
        }

        return {
          id: doc.id,
          ...clientData,
          daysInArrears,
          group,
          priority,
          score
        };
      });
      
      // Sort by score descending
      data.sort((a, b) => b.score - a.score);
      setClients(data);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

    return () => unsubscribe();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'clients'), {
        ...newClient,
        status: 'Pendiente',
        assignedTo: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewClient({ name: '', phone: '', product: '', amount: 0, contactDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'clients', id), {
        status: newStatus,
        lastContact: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Teléfono', 'Producto', 'Monto', 'Mora (Días)', 'Grupo', 'Prioridad', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...clients.map(c => [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.product || ''}"`,
        c.amount,
        c.daysInArrears,
        c.group,
        c.priority,
        c.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `cobranza_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGroupColor = (group: string) => {
    switch(group) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Cobranza</h2>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mora (Días)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.daysInArrears}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getGroupColor(client.group)}`}>
                      Grupo {client.group} ({client.priority})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${client.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={client.status}
                      onChange={(e) => updateStatus(client.id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Contactado">Contactado</option>
                      <option value="No responde">No responde</option>
                      <option value="Pagó">Pagó</option>
                      <option value="No interesado">No interesado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full">
                      <Phone className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Agregar Cliente a Cobranza</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input required type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto Deuda</label>
                <input required type="number" value={newClient.amount} onChange={e => setNewClient({...newClient, amount: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Contacto Original</label>
                <input required type="date" value={newClient.contactDate} onChange={e => setNewClient({...newClient, contactDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
