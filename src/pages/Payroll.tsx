import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  ArrowUpRight, ArrowDownRight, CreditCard, Wallet, 
  PieChart, BarChart3, AlertCircle, CheckCircle2,
  Download, Filter, Search, Zap, Clock, ShieldCheck,
  Percent, Briefcase, User, Info, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data for Bloomberg Terminal Style
const PAYMENTS = [
  { id: '1', agent: 'Carlos Ruiz', role: 'Closer', revenue: 42000, cost: 5000, type: 'Mixed', status: 'Scheduled', date: '2024-03-30', bonus: 1250 },
  { id: '2', agent: 'Ana Silva', role: 'Setter', revenue: 12000, cost: 2500, type: 'Fixed', status: 'Paid', date: '2024-03-15', bonus: 0 },
  { id: '3', agent: 'Maria Gomez', role: 'Support', revenue: 3200, cost: 2800, type: 'Appointment', status: 'Pending', date: '2024-03-28', bonus: 150 },
  { id: '4', agent: 'Miguel Rojas', role: 'Ops', revenue: 15000, cost: 4500, type: 'Mixed', status: 'Scheduled', date: '2024-03-30', bonus: 500 },
  { id: '5', agent: 'Paula Lopez', role: 'Setter', revenue: 5000, cost: 1500, type: 'Appointment', status: 'Scheduled', date: '2024-03-30', bonus: 200 },
];

export default function Payroll() {
  const [activeType, setActiveType] = useState('All');
  
  const totalPayroll = PAYMENTS.reduce((acc, p) => acc + p.cost + (p.bonus || 0), 0);
  const monthlyBudget = 15000; // Lower budget to trigger the alert
  const deviation = ((totalPayroll - monthlyBudget) / monthlyBudget) * 100;
  const isOverBudget = totalPayroll > monthlyBudget;

  const filteredPayments = activeType === 'All' 
    ? PAYMENTS 
    : PAYMENTS.filter(p => p.type === activeType);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono p-4 md:p-8">
      {/* BLOOMBERG STYLE HEADER */}
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Dynamic Budget Alert Banner */}
        <AnimatePresence>
          {isOverBudget && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-center justify-between group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-2 bg-red-500 rounded-lg text-black">
                   <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xs font-black text-red-500 uppercase tracking-widest">CRITICAL: Budget Deviation Detected</p>
                   <p className="text-sm font-bold text-white uppercase italic">Payroll actual (${totalPayroll.toLocaleString()}) supera el presupuesto mensual (${monthlyBudget.toLocaleString()}) por {deviation.toFixed(1)}%</p>
                </div>
              </div>
              <div className="text-right relative z-10">
                 <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Proyección Cierre</p>
                 <p className="text-xl font-black text-white italic">${(totalPayroll * 1.1).toFixed(0)} <span className="text-xs text-red-500">▼</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-[#00F0FF] rounded-full animate-pulse" />
              <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Kaivincia Real-Time Terminal</h1>
            </div>
            <p className="text-4xl font-black text-white italic tracking-tighter uppercase">Nómina & Rentabilidad <span className="text-[#00F0FF]">SYS.01</span></p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl min-w-[150px]">
               <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Volume Period (USD)</p>
               <p className="text-xl font-black text-[#00F0FF] italic">$142,850.00</p>
             </div>
             <button className="h-14 px-8 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00F0FF] transition-all flex items-center gap-3">
               <Download className="w-4 h-4" /> Export.CSV
             </button>
          </div>
        </header>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Payroll (Live)', val: `$${totalPayroll.toLocaleString()}`, detail: '+4.2% vs Prev', icon: Wallet, color: 'white' },
            { label: 'Smart Bonuses (Algorithmic)', val: '$2,220', detail: 'Calculated by KPIs', icon: Zap, color: '#00F0FF' },
            { label: 'Operating Margin', val: '64.2%', detail: 'Stable Trend', icon: TrendingUp, color: 'green' },
            { label: 'CAC Total', val: '$420', detail: '-12% Efficiency', icon: BarChart3, color: 'blue' }
          ].map((m, i) => (
            <div key={i} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-[#00F0FF]/30 transition-all">
               <m.icon className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-800/20" />
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{m.label}</p>
               <p className={`text-3xl font-black italic tracking-tighter ${i === 1 ? 'text-[#00F0FF]' : 'text-white'}`}>{m.val}</p>
               <p className="text-[8px] font-bold text-gray-500 mt-2 uppercase">{m.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ROI CHART - Agent Profitability */}
          <div className="xl:col-span-2 bg-gray-900/30 border border-gray-800 rounded-[2rem] p-8">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-[#00F0FF]" /> Agent ROI Matrix (Live)
               </h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                     <span className="text-[8px] font-black uppercase text-gray-500">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-red-500 rounded-sm" />
                     <span className="text-[8px] font-black uppercase text-gray-500">Cost</span>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               {PAYMENTS.map(p => {
                 const roi = ((p.revenue - p.cost) / p.cost) * 100;
                 const isMaria = p.agent === 'Maria Gomez';
                 return (
                   <div key={p.id} className="relative">
                      <div className="flex justify-between items-end mb-2">
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white uppercase italic">{p.agent}</span>
                            <span className="text-[8px] font-black text-gray-500 uppercase border border-gray-800 px-2 rounded-full">{p.role}</span>
                         </div>
                         <div className={`text-xs font-black italic rounded px-2 py-0.5 ${
                            roi > 200 ? 'text-green-500 bg-green-500/10' :
                            roi > 150 ? 'text-cyan-500/100 bg-cyan-500/100/10' : 'text-red-500 bg-red-500/10'
                         } ${isMaria ? 'animate-pulse !text-orange-500 !bg-orange-500/10 border border-orange-500/50' : ''}`}>
                            ROI: {roi.toFixed(0)}%
                         </div>
                      </div>
                      <div className="h-6 w-full bg-gray-800/50 rounded-lg overflow-hidden flex gap-0.5">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(p.revenue / 45000) * 100}%` }}
                            className="h-full bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                         />
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(p.cost / 45000) * 100}%` }}
                            className="h-full bg-red-500/80" 
                         />
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Payment Distribution Filter */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-[2rem] p-8 flex flex-col">
             <h3 className="text-lg font-black text-white uppercase italic mb-8">Type Distribution</h3>
             <div className="grid grid-cols-2 gap-4 mb-8">
                {['All', 'Fixed', 'Appointment', 'Mixed'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeType === type 
                        ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_20px_rgba(181,154,69,0.3)]' 
                        : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>

             <div className="flex-1 space-y-4">
                <div className="p-6 bg-gray-800/30 border border-gray-800 rounded-2xl">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Analysis Node</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Fixed Strategy</span>
                         <span className="text-xs font-black text-white uppercase">Active</span>
                      </div>
                      <div className="h-1 w-full bg-gray-800 rounded-full">
                         <div className="h-full bg-[#00F0FF] w-[40%]" />
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Appointment Efficiency</span>
                         <span className="text-xs font-black text-white uppercase italic">High</span>
                      </div>
                      <div className="h-1 w-full bg-gray-800 rounded-full">
                         <div className="h-full bg-blue-500 w-[85%]" />
                      </div>
                   </div>
                </div>
                <div className="p-4 bg-[#00F0FF]/5 border border-[#00F0FF]/20 rounded-xl">
                   <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-[#00F0FF] mt-0.5" />
                      <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase italic">
                         Smart Bonus System: Automatización de incentivos basada en Revenue Real-Time.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* PAYMENTS TERMINAL TABLE */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/10">
             <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Transaction Ledger</h3>
             <div className="flex gap-4">
                <div className="h-12 w-12 bg-gray-800 rounded-xl flex items-center justify-center text-[#00F0FF] cursor-pointer hover:bg-[#00F0FF] hover:text-black transition-all">
                   <Filter className="w-5 h-5" />
                </div>
                <div className="h-12 w-64 bg-gray-800 border border-gray-700 rounded-xl flex items-center px-4 gap-3">
                   <Search className="w-4 h-4 text-gray-500" />
                   <input className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-white placeholder-gray-600" placeholder="Filter Ledger..." />
                </div>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] border-b border-gray-800">
                <tr>
                  <th className="px-8 py-5 italic">Agent/Node</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5 italic">Revenue (Generated)</th>
                  <th className="px-8 py-5">Base Cost</th>
                  <th className="px-8 py-5 italic">Smart Bonus</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Settlement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center font-black text-white italic border border-gray-800 rotate-2 group-hover:rotate-0 transition-transform shadow-xl">
                          {p.agent[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase italic">{p.agent}</p>
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{p.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-blue-400 text-xs italic">${p.revenue.toLocaleString()}</td>
                    <td className="px-8 py-6 font-black text-white text-xs">${p.cost.toLocaleString()}</td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Zap className={`w-3 h-3 ${p.bonus > 0 ? 'text-[#00F0FF] fill-[#00F0FF]' : 'text-gray-700'}`} />
                          <span className={`text-[10px] font-black italic ${p.bonus > 0 ? 'text-[#00F0FF]' : 'text-gray-700'}`}>
                             {p.bonus > 0 ? `+$${p.bonus}` : '--'}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          p.status === 'Paid' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                          p.status === 'Scheduled' ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'
                        }`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          p.status === 'Paid' ? 'text-green-500' :
                          p.status === 'Scheduled' ? 'text-blue-500' : 'text-amber-500'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-mono text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
