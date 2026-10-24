import { useState } from 'react';
import { Calculator, DollarSign, FileText, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

export default function Accounting() {
  const [activeTab, setActiveTab] = useState('dre');

  const tabs = [
    { id: 'dre', name: 'DRE Gerencial' },
    { id: 'ar', name: 'Cuentas por Cobrar (AR)' },
    { id: 'ap', name: 'Cuentas por Pagar (AP)' },
    { id: 'diario', name: 'Diario Contable' },
    { id: 'impuestos', name: 'Impuestos' },
    { id: 'flujo', name: 'Flujo de Caja' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contabilidad y Costos</h2>
          <p className="text-sm text-gray-500 mt-1">Centro de Control Financiero y Rentabilidad Real</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Moneda:</span>
            <select className="text-sm font-bold text-gray-900 border-none bg-transparent focus:ring-0 p-0">
              <option>USD ($)</option>
              <option>BRL (R$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total por Cobrar</p>
          <p className="text-xl font-bold text-green-600">$12,450</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total por Pagar</p>
          <p className="text-xl font-bold text-red-600">$4,200</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Flujo Neto Proyectado</p>
          <p className="text-xl font-bold text-blue-600">$8,250</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
          <p className="text-xs text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Facturas Vencidas</p>
          <p className="text-xl font-bold text-red-700">3</p>
        </div>
        <div className="bg-cyan-500/10 p-4 rounded-xl shadow-sm border border-yellow-100">
          <p className="text-xs text-yellow-700 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Impuestos Próximos</p>
          <p className="text-xl font-bold text-yellow-800">En 5 días</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-[#00F0FF] text-[#00F0FF]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'dre' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Demonstrativo do Resultado do Exercício (DRE)</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 max-w-3xl">
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Receita Bruta</span>
                    <span>$45,231.89</span>
                  </div>
                  <div className="flex justify-between text-red-600 pl-4">
                    <span>(-) Impostos</span>
                    <span>$4,523.19</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-2">
                    <span>= Receita Líquida</span>
                    <span>$40,708.70</span>
                  </div>
                  <div className="flex justify-between text-red-600 pl-4">
                    <span>(-) Custos Diretos</span>
                    <span>$8,450.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-2">
                    <span>= Lucro Bruto</span>
                    <span>$32,258.70</span>
                  </div>
                  <div className="flex justify-between text-red-600 pl-4">
                    <span>(-) Despesas Operacionais</span>
                    <span>$4,000.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-2">
                    <span>= Lucro Operacional</span>
                    <span>$28,258.70</span>
                  </div>
                  <div className="flex justify-between text-red-600 pl-4">
                    <span>(-) Despesas Financeiras</span>
                    <span>$500.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-600 border-t-2 border-gray-400 pt-2 text-base">
                    <span>= Resultado Líquido</span>
                    <span>$27,758.70</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ar' && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Cuentas por Cobrar (AR)</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Control de facturas emitidas, aging (0-30, 30-60 días), y alertas de clientes en mora.
              </p>
            </div>
          )}

          {activeTab === 'ap' && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Cuentas por Pagar (AP)</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Registro de proveedores, impuestos, nómina y servicios. Alertas de próximos vencimientos.
              </p>
            </div>
          )}

          {['diario', 'impuestos', 'flujo'].includes(activeTab) && (
            <div className="text-center py-12">
              <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 capitalize">{activeTab.replace('-', ' ')}</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Módulo en construcción. Aquí se gestionarán los asientos manuales, recordatorios de impuestos ante la Receita Federal y proyecciones de caja.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
