import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  User, 
  MapPin, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { UtilityBillData } from '../../types/calls';

interface ZohoUtilityBillGeneratorProps {
  className?: string;
}

const DEFAULT_BILL_DATA: UtilityBillData = {
  id: 'UB-2026-904',
  name: 'Zaydeli De La Rosa',
  company: 'Kaivincia Corp',
  address: '1428 West Slauson Ave, Los Angeles, CA 90047',
  account: '9428-1156-32-1',
  date: '2026-06-15',
  amount: '154.20',
  dueDate: '2026-07-10',
  status: 'draft',
  notes: 'Verificación de dirección física para activación de troncal SIP en California.'
};

export default function ZohoUtilityBillGenerator({ className = '' }: ZohoUtilityBillGeneratorProps) {
  const { t } = useLanguage();

  const [bill, setBill] = useState<UtilityBillData>(DEFAULT_BILL_DATA);
  const [isGenerated, setIsGenerated] = useState(false);

  const handlePrint = () => {
    setBill(prev => ({ ...prev, status: prev.status === 'draft' ? 'generated' : prev.status }));
    setIsGenerated(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleReset = () => {
    setBill(DEFAULT_BILL_DATA);
    setIsGenerated(false);
  };

  const getStatusBadge = (status: UtilityBillData['status']) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] uppercase">Aprobado</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] uppercase">Rechazado</span>;
      case 'sent':
        return <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-bold text-[10px] uppercase">Enviado a Revisión</span>;
      case 'generated':
        return <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold text-[10px] uppercase">Generado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[10px] uppercase">Borrador</span>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estilos específicos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-utility-bill, #printable-utility-bill * {
            visibility: visible;
          }
          #printable-utility-bill {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Banner de Descargo Legal / Utilidad de Maquetación */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Utilidad de Maquetación Documental de Comprobante (Zoho Utility Bill)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Esta herramienta es un formateador de maquetación visual para validar requisitos de dirección fiscal en operadoras telefónicas (e.g. Zoho Voice / Zadarma). <strong>No requiere token ni sincronización con la API de Zoho CRM.</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Formulario de Parámetros + Vista Previa Imprimible */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario Editor */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Parámetros del Comprobante
            </h3>
            {getStatusBadge(bill.status)}
          </div>

          <div className="space-y-3 text-xs">
            {/* Estado del Recibo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Estado del Documento
              </label>
              <select
                value={bill.status}
                onChange={(e) => setBill({ ...bill, status: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="draft">Borrador</option>
                <option value="generated">Generado</option>
                <option value="sent">Enviado</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>

            {/* Nombre del Titular */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nombre del Titular
              </label>
              <input
                type="text"
                value={bill.name}
                onChange={(e) => setBill({ ...bill, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400 font-semibold"
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nombre de la Empresa (C/O)
              </label>
              <input
                type="text"
                value={bill.company}
                onChange={(e) => setBill({ ...bill, company: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400 font-semibold"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Dirección Física (USA)
              </label>
              <input
                type="text"
                value={bill.address}
                onChange={(e) => setBill({ ...bill, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Cuenta y Monto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nº de Cuenta
                </label>
                <input
                  type="text"
                  value={bill.account}
                  onChange={(e) => setBill({ ...bill, account: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Monto Total ($ USD)
                </label>
                <input
                  type="text"
                  value={bill.amount}
                  onChange={(e) => setBill({ ...bill, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Fechas de Emisión y Vencimiento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={bill.date}
                  onChange={(e) => setBill({ ...bill, date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={bill.dueDate}
                  onChange={(e) => setBill({ ...bill, dueDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Notas / Propósito de Verificación
              </label>
              <textarea
                rows={2}
                value={bill.notes}
                onChange={(e) => setBill({ ...bill, notes: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa Imprimible (Hoja de Estilo Formal) */}
        <div className="lg:col-span-7">
          <div 
            id="printable-utility-bill"
            className="bg-white text-slate-900 border border-slate-300 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden font-sans"
          >
            {/* Marca de agua de comprobante */}
            <div className="absolute right-6 top-6 opacity-10 pointer-events-none text-right">
              <Building2 className="w-36 h-36 text-slate-900" />
            </div>

            {/* Encabezado del Recibo */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 block">
                  PACIFIC TELECOM & POWER SERVICES
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">
                  Utility Statement
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Statement ID: {bill.id}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-600 block">
                  Account Number:
                </span>
                <span className="text-lg font-mono font-black text-slate-900">
                  {bill.account}
                </span>
                <div className="mt-1">
                  {getStatusBadge(bill.status)}
                </div>
              </div>
            </div>

            {/* Datos del Cliente y Dirección */}
            <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Service Address / Customer Details
                </span>
                <p className="font-bold text-slate-900 text-sm">{bill.name}</p>
                <p className="font-semibold text-slate-700">{bill.company}</p>
                <p className="text-slate-600 mt-1 leading-relaxed">{bill.address}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 font-mono">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 font-sans">
                  Billing Schedule
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statement Date:</span>
                  <span className="font-bold text-slate-800">{bill.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Due:</span>
                  <span className="font-bold text-rose-600">{bill.dueDate}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Total Due:</span>
                  <span className="font-black text-base text-slate-900">${bill.amount} USD</span>
                </div>
              </div>
            </div>

            {/* Desglose de Servicios */}
            <div className="mb-8">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 uppercase text-[10px] font-black text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Service Description</th>
                    <th className="p-3">Period</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold">Business VoIP Telephony Trunking (DID / SIP Lines)</td>
                    <td className="p-3 font-mono text-slate-500">Monthly Cycle</td>
                    <td className="p-3 text-right font-mono font-bold">$98.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">High-Speed Fiber Telecommunications Service</td>
                    <td className="p-3 font-mono text-slate-500">Monthly Cycle</td>
                    <td className="p-3 text-right font-mono font-bold">$45.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Regulatory Telecom Fee & Surcharges</td>
                    <td className="p-3 font-mono text-slate-500">Fixed</td>
                    <td className="p-3 text-right font-mono font-bold">$11.20</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold">
                    <td colSpan={2} className="p-3 text-right text-sm uppercase">Total Balance Due:</td>
                    <td className="p-3 text-right text-base font-black text-slate-900">${bill.amount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pie del Recibo con Sello Oficial */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] text-slate-500">
              <div>
                <p className="font-bold text-slate-700">Official Physical Address Verification Record</p>
                <p>Pacific Telecom Services LLC · Registered Operator ID #CA-904221</p>
              </div>
              <div className="px-4 py-2 border-2 border-slate-800 rounded-xl text-center font-mono">
                <span className="block font-black text-slate-900 text-xs">VERIFIED RECORD</span>
                <span className="text-[8px] text-slate-500">ID: {bill.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
