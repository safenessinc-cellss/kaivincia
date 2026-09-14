import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import jsPDF from 'jspdf';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, DollarSign, Clock, Users, ArrowUpRight, ArrowDownRight,
  Filter, Download, Calendar
} from 'lucide-react';

export default function Reports() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '365d'>('30d');
  const [marginFilter, setMarginFilter] = useState<'all' | 'high' | 'low'>('all');

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubLogs = onSnapshot(collection(db, 'time_logs'), (snapshot) => {
      setTimeLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCollaborators = onSnapshot(collection(db, 'collaborators'), (snapshot) => {
      setCollaborators(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubClients();
      unsubLogs();
      unsubInvoices();
      unsubCollaborators();
    };
  }, []);

  // Process data for charts
  const reportData = projects.map(project => {
    const projectInvoices = invoices.filter(inv => inv.client === project.client || inv.projectId === project.id);
    const revenue = projectInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    
    // Calculate real cost based on collaborators assigned to project logs
    const projectLogs = timeLogs.filter(log => log.projectId === project.id);
    const cost = projectLogs.reduce((acc, log) => {
      const collaborator = collaborators.find(c => c.id === log.collaboratorId || c.name === log.collaboratorName);
      const hourlyRate = collaborator?.baseSalary ? (collaborator.baseSalary / 160) : 15; // Default to 15 if not found
      return acc + (Number(log.hours) * hourlyRate);
    }, 0);
    
    const hours = projectLogs.reduce((acc, log) => acc + (Number(log.hours) || 0), 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      name: project.name,
      revenue,
      cost,
      profit,
      margin: Math.round(margin),
      hours
    };
  }).filter(d => d.revenue > 0 || d.cost > 0);

  const clientReportData = clients.map(client => {
    const clientInvoices = invoices.filter(inv => inv.client === client.name || inv.clientId === client.id);
    const revenue = clientInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    
    const clientProjects = projects.filter(p => p.clientId === client.id || p.client === client.name);
    const projectIds = clientProjects.map(p => p.id);
    
    const clientLogs = timeLogs.filter(log => projectIds.includes(log.projectId));
    const cost = clientLogs.reduce((acc, log) => {
      const collaborator = collaborators.find(c => c.id === log.collaboratorId || c.name === log.collaboratorName);
      const hourlyRate = collaborator?.baseSalary ? (collaborator.baseSalary / 160) : 15;
      return acc + (Number(log.hours) * hourlyRate);
    }, 0);

    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      name: client.company || client.name,
      revenue,
      cost,
      profit,
      margin: Math.round(margin)
    };
  }).filter(d => d.revenue > 0 || d.cost > 0);

  const totalRevenue = reportData.reduce((acc, d) => acc + d.revenue, 0);
  const totalCost = reportData.reduce((acc, d) => acc + d.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = reportData.length > 0 ? reportData.reduce((acc, d) => acc + d.margin, 0) / reportData.length : 0;

  const filteredReportData = reportData.filter(d => {
    if (marginFilter === 'high') return d.margin >= 30;
    if (marginFilter === 'low') return d.margin < 20;
    return true;
  });

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(0, 240, 255);
      doc.setFontSize(20);
      doc.text('REPORTE EJECUTIVO DE RENTABILIDAD', 14, 25);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 50);
      doc.text(`Periodo Analizado: ${timeRange === '30d' ? 'Últimos 30 días' : timeRange === '90d' ? 'Últimos 90 días' : 'Año Completo'}`, 14, 58);
      
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Métricas Globales de Operación:', 14, 75);
      doc.setFontSize(10);
      doc.text(`Ingresos Totales: $${totalRevenue.toLocaleString()}`, 14, 85);
      doc.text(`Costos Operativos: $${totalCost.toLocaleString()}`, 14, 93);
      doc.text(`Utilidad Neta: $${totalProfit.toLocaleString()}`, 14, 101);
      doc.text(`Margen Promedio: ${Math.round(avgMargin)}%`, 14, 109);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 118, 196, 118);
      
      doc.setFontSize(12);
      doc.text('Desglose de Proyectos:', 14, 130);
      let y = 142;
      reportData.slice(0, 10).forEach((p, idx) => {
        doc.setFontSize(9);
        doc.setTextColor(70, 80, 95);
        doc.text(`${idx + 1}. ${p.name} | Ingreso: $${p.revenue.toLocaleString()} | Costo: $${p.cost.toLocaleString()} | Margen: ${p.margin}%`, 14, y);
        y += 8;
      });
      
      doc.save(`Reporte_Rentabilidad_${timeRange}.pdf`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    }
  };

  const COLORS = ['#00F0FF', '#1f2937', '#4b5563', '#9ca3af', '#e5e7eb'];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Analíticas</h2>
          <p className="text-sm text-gray-500 mt-1">Inteligencia de Negocios y Rentabilidad Real</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 text-sm cursor-pointer shadow-xs focus:outline-none"
          >
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="365d">Año Completo</option>
          </select>
          <button 
            onClick={handleExportPDF}
            className="bg-[#00F0FF] text-black hover:bg-[#00d0df] px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition-all cursor-pointer active:scale-95"
            title="Exportar Reporte Ejecutivo en PDF"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Ingresos Totales</p>
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-bold">
            <ArrowUpRight className="w-3 h-3" /> 12.5% vs mes anterior
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Costo Operativo</p>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2 font-medium">Basado en {reportData.reduce((acc, d) => acc + d.hours, 0)}h registradas</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Utilidad Neta</p>
            <div className="p-2 bg-[#00F0FF]/10 rounded-lg text-[#00F0FF]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalProfit.toLocaleString()}</p>
          <p className="text-xs text-[#00F0FF] mt-2 font-bold">Margen: {avgMargin.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-gray-500">Eficiencia de Equipo</p>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">92%</p>
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1 font-bold">
            <ArrowUpRight className="w-3 h-3" /> +3% optimización
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Ingresos vs Costos por Proyecto</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 320 }}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="Ingresos" fill="#00F0FF" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="cost" name="Costos" fill="#1f2937" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Distribución de Utilidad</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 400, height: 320 }}>
              <PieChart>
                <Pie
                  data={reportData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="profit"
                  nameKey="name"
                >
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Detalle de Rentabilidad por Proyecto</h3>
          <button 
            onClick={() => setMarginFilter(prev => prev === 'all' ? 'high' : prev === 'high' ? 'low' : 'all')}
            className="text-cyan-700 hover:text-cyan-900 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Cambiar filtro de margen de rentabilidad"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-600" />
            <span>Filtro: {marginFilter === 'all' ? 'Todos los Proyectos' : marginFilter === 'high' ? 'Márgenes Altos (≥30%)' : 'Márgenes Bajos (<20%)'}</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Proyecto</th>
                <th className="px-6 py-4">Horas</th>
                <th className="px-6 py-4">Ingresos</th>
                <th className="px-6 py-4">Costo Real</th>
                <th className="px-6 py-4">Utilidad</th>
                <th className="px-6 py-4">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReportData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-gray-600">{d.hours}h</td>
                  <td className="px-6 py-4 text-green-600 font-bold">${d.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-500 font-medium">${d.cost.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-gray-900">${d.profit.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      d.margin > 30 ? 'bg-green-100 text-green-700' :
                      d.margin > 15 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.margin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Rentabilidad por Cliente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Ingresos</th>
                <th className="px-6 py-4">Costo Operativo</th>
                <th className="px-6 py-4">Margen Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientReportData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-green-600 font-bold">${d.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-500 font-medium">${d.cost.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${d.margin > 30 ? 'bg-green-500' : d.margin > 15 ? 'bg-cyan-500/100' : 'bg-red-500'}`}
                          style={{ width: `${Math.max(0, Math.min(100, d.margin))}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-700 w-10">{d.margin}%</span>
                    </div>
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
