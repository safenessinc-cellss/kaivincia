import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from '../firebase';
import { differenceInDays, parseISO } from 'date-fns';
import { Search, Plus, Phone, MessageCircle, Download, MapPin, Camera, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Cobranza() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({ name: '', phone: '', product: '', amount: 0, contactDate: new Date().toISOString().split('T')[0] });
  
  // Visit state
  const [visitData, setVisitData] = useState({
    location: null as { lat: number, lng: number } | null,
    photoUrl: '',
    authorized: false,
    notes: '',
    isCapturingLocation: false,
    isUploading: false
  });
  const [isUpdating, setIsUpdating] = useState(false);

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

  const captureLocation = () => {
    setVisitData(prev => ({ ...prev, isCapturingLocation: true }));
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada por el navegador");
      setVisitData(prev => ({ ...prev, isCapturingLocation: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVisitData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          isCapturingLocation: false
        }));
      },
      (error) => {
        console.error("Error capturing location:", error);
        alert("Error al capturar ubicación. Por favor permite el acceso al GPS.");
        setVisitData(prev => ({ ...prev, isCapturingLocation: false }));
      }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVisitData(prev => ({ ...prev, isUploading: true }));
    try {
      const storageRef = ref(storage, `cobranza/visits/${selectedClient.id}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setVisitData(prev => ({ ...prev, photoUrl: url, isUploading: false }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Error al subir la foto");
      setVisitData(prev => ({ ...prev, isUploading: false }));
    }
  };

  const handleSaveVisit = async () => {
    if (!selectedClient) return;
    setIsUpdating(true);
    try {
      // Guardar visita en una subcolección
      const visitRef = doc(collection(db, `clients/${selectedClient.id}/visits`));
      const visitPayload = {
        location: visitData.location,
        photoUrl: visitData.photoUrl,
        authorized: visitData.authorized,
        notes: visitData.notes,
        visitedAt: new Date().toISOString(),
        visitedBy: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'Agente'
      };
      
      await setDoc(visitRef, visitPayload);

      // Actualizar estado del cliente
      await updateDoc(doc(db, 'clients', selectedClient.id), {
        lastVisit: new Date().toISOString(),
        status: visitData.authorized ? 'Autorizado' : 'No Autorizado',
        lastResult: visitData.authorized ? 'Pago Autorizado/Acordado' : 'Visita sin autorización',
        updatedAt: new Date().toISOString()
      });

      setIsVisitModalOpen(false);
      resetVisitForm();
      alert("Gestión guardada exitosamente");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `clients/${selectedClient.id}/visits`);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetVisitForm = () => {
    setVisitData({
      location: null,
      photoUrl: '',
      authorized: false,
      notes: '',
      isCapturingLocation: false,
      isUploading: false
    });
  };

  const openVisitModal = (client: any) => {
    setSelectedClient(client);
    setIsVisitModalOpen(true);
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
                    <div className="flex flex-col gap-1">
                      <select
                        value={client.status}
                        onChange={(e) => updateStatus(client.id, e.target.value)}
                        className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Contactado">Contactado</option>
                        <option value="No responde">No responde</option>
                        <option value="Pagó">Pagó</option>
                        <option value="No interesado">No interesado</option>
                        <option value="Autorizado">Autorizado</option>
                        <option value="No Autorizado">No Autorizado</option>
                      </select>
                      {client.lastResult && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          client.status === 'Autorizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {client.lastResult}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full" title="WhatsApp">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                    <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-full" title="Llamar">
                      <Phone className="h-4 w-4" />
                    </a>
                    <button 
                      onClick={() => openVisitModal(client)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-xs font-bold"
                      title="Registrar Visita GPS"
                    >
                      <MapPin className="h-4 w-4" />
                      Visitar
                    </button>
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

      {/* Modal Registro de Visita GPS */}
      {isVisitModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Gestión de Cobranza GPS</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Cliente: {selectedClient.name}</p>
              </div>
              <button 
                onClick={() => { setIsVisitModalOpen(false); resetVisitForm(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* GPS Tracking */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Geolocalización Satelital</label>
                <button 
                  onClick={captureLocation}
                  disabled={visitData.isCapturingLocation}
                  className={`w-full py-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                    visitData.location 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-gray-50 border-dashed border-gray-300 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {visitData.isCapturingLocation ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : visitData.location ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-widest">Coordenadas Capturadas</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-widest">Capturar Ubicación Actual</span>
                    </>
                  )}
                </button>
                {visitData.location && (
                  <p className="text-[10px] text-gray-400 mt-2 font-mono text-center">
                    LAT: {visitData.location.lat.toFixed(6)} | LNG: {visitData.location.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Evidencia Fotográfica</label>
                <div className="grid grid-cols-1 gap-4">
                  {!visitData.photoUrl ? (
                    <label className="w-full aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      {visitData.isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subir Foto de Visita</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={visitData.isUploading} />
                    </label>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                      <img src={visitData.photoUrl} alt="Visit evidence" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setVisitData(prev => ({ ...prev, photoUrl: '' }))}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Authorization status */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Estado de Autorización</label>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setVisitData(prev => ({ ...prev, authorized: true }))}
                    className={`flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all ${
                      visitData.authorized 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-500/20' 
                        : 'bg-white text-gray-400 border border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">¿Autorizado? SÍ</span>
                  </button>
                  <button 
                    onClick={() => setVisitData(prev => ({ ...prev, authorized: false }))}
                    className={`flex-1 py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all ${
                      !visitData.authorized 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-200 ring-4 ring-red-500/20' 
                        : 'bg-white text-gray-400 border border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">¿Autorizado? NO</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones de Visita</label>
                <textarea 
                  value={visitData.notes}
                  onChange={e => setVisitData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Escribe detalles sobre la gestión realizada..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  rows={3}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => { setIsVisitModalOpen(false); resetVisitForm(); }}
                  className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveVisit}
                  disabled={!visitData.location || !visitData.photoUrl || isUpdating}
                  className={`flex-[2] py-4 rounded-xl text-white font-black uppercase tracking-widest transition-all ${
                    visitData.location && visitData.photoUrl 
                      ? 'bg-black hover:bg-gray-800 shadow-xl' 
                      : 'bg-gray-200 cursor-not-allowed text-gray-400'
                  }`}
                >
                  {isUpdating ? 'Procesando...' : 'Finalizar Gestión & Guardar GPS'}
                </button>
              </div>
              
              {!visitData.location && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Se requiere ubicación GPS
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
