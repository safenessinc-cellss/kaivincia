import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  TrendingUp, DollarSign, Users, Award, Target, 
  CheckCircle2, Calendar, ArrowUpRight, Search, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function Commissions() {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [prospects, setProspects] = useState<any[]>([]);
  const [paymentRules, setPaymentRules] = useState({ appointmentBooked: 10, appointmentEffective: 25 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubCollabs = onSnapshot(collection(db, 'collaborators'), (snapshot) => {
      setCollaborators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProspects = onSnapshot(collection(db, 'prospects'), (snapshot) => {
      setProspects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRules = onSnapshot(collection(db, 'settings'), (snapshot) => {
      const payrollDoc = snapshot.docs.find(doc => doc.id === 'payroll');
      if (payrollDoc) {
        setPaymentRules(payrollDoc.data() as any);
      }
      setLoading(false);
    });

    return () => {
      unsubCollabs();
      unsubProspects();
      unsubRules();
    };
  }, []);

  // Calculate commissions per collaborator
  const commissionData = collaborators.map(collab => {
    const collabProspects = prospects.filter(p => p.assignedTo === collab.id || p.setterName === collab.name);
    
    const bookedCount = collabProspects.filter(p => p.status === 'Cita Agendada').length;
    const effectiveCount = collabProspects.filter(p => p.status === 'Cita Efectiva').length;
    
    const totalCommission = (bookedCount * paymentRules.appointmentBooked) + (effectiveCount * paymentRules.appointmentEffective);

    return {
      name: collab.name,
      role: collab.role,
      booked: bookedCount,
      effective: effectiveCount,
      total: totalCommission,
      conversion: bookedCount > 0 ? Math.round((effectiveCount / bookedCount) * 100) : 0
    };
  }).sort((a, b) => b.total - a.total);

  const totalCommissions = commissionData.reduce((acc, d) => acc + d.total, 0);
  const totalBooked = commissionData.reduce((acc, d) => acc + d.booked, 0);
  const totalEffective = commissionData.reduce((acc, d) => acc + d.effective, 0);

  const filteredData = commissionData.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Comisiones</h2>
          <p className="text-sm text-gray-500 mt-1">Seguimiento de bonos y productividad en tiempo real</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00F0FF] outline-none"
            />
          </div>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Total Comisiones</p>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalCommissions.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-bold">
            <ArrowUpRight className="w-3 h-3" /> +8.2% este mes
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Citas Agendadas</p>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalBooked}</p>
          <p className="text-xs text-gray-500 mt-2 font-medium">Bono: ${paymentRules.appointmentBooked}/u</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Citas Efectivas</p>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalEffective}</p>
          <p className="text-xs text-gray-500 mt-2 font-medium">Bono: ${paymentRules.appointmentEffective}/u</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Conversión Promedio</p>
            <div className="p-2 bg-[#00F0FF]/10 rounded-lg text-[#00F0FF]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalBooked > 0 ? Math.round((totalEffective / totalBooked) * 100) : 0}%
          </p>
          <p className="text-xs text-[#00F0FF] mt-2 font-bold">Meta: 45%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-500/100" /> Ranking de Productividad
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={commissionData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="total" name="Comisión Total ($)" fill="#00F0FF" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Rendimiento de Conversión
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={commissionData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="conversion" name="Conversión (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Detalle por Colaborador</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Agendadas</th>
                <th className="px-6 py-4">Efectivas</th>
                <th className="px-6 py-4">Conversión</th>
                <th className="px-6 py-4">Comisión Acumulada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {d.name.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{d.role}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{d.booked}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{d.effective}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      d.conversion > 40 ? 'bg-green-100 text-green-700' :
                      d.conversion > 20 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.conversion}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-green-600 font-black text-lg">
                    ${d.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
