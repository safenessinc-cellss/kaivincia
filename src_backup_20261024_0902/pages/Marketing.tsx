import { useState } from 'react';
import { 
  Megaphone, BarChart3, Target, Users, TrendingUp, 
  Filter, Plus, DollarSign, MousePointerClick, Calendar
} from 'lucide-react';

export default function Marketing() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Marketing</h2>
          <p className="text-sm text-gray-500 mt-1">Generación de leads, campañas y posicionamiento</p>
        </div>
        <button className="bg-[#00F0FF] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nueva Campaña
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'dashboard', label: 'Dashboard General', icon: BarChart3 },
            { id: 'campanas', label: 'Campañas', icon: Megaphone },
            { id: 'trafico', label: 'Tráfico y Leads', icon: Target },
            { id: 'organico', label: 'Contenido Orgánico', icon: Users },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-[#00F0FF] text-[#00F0FF] bg-cyan-500/10/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Inversión Total (Mes)</p>
                  <p className="text-2xl font-bold text-gray-900">$4,500</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Leads Generados</p>
                  <p className="text-2xl font-bold text-gray-900">850</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Citas Generadas</p>
                  <p className="text-2xl font-bold text-gray-900">142</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">Inscripciones</p>
                  <p className="text-2xl font-bold text-green-600">35</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">ROI General</p>
                  <p className="text-2xl font-bold text-green-600">3.2X</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Embudo de Conversión General</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center"><MousePointerClick className="w-2 h-2 text-blue-600"/></div>
                        <span className="text-sm text-gray-600">Impresiones / Clicks</span>
                      </div>
                      <span className="font-bold text-gray-900">45,200</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: '100%'}}></div></div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center"><Users className="w-2 h-2 text-indigo-600"/></div>
                        <span className="text-sm text-gray-600">Leads</span>
                      </div>
                      <span className="font-bold text-gray-900">850</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{width: '60%'}}></div></div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center"><Calendar className="w-2 h-2 text-yellow-600"/></div>
                        <span className="text-sm text-gray-600">Citas</span>
                      </div>
                      <span className="font-bold text-gray-900">142</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-cyan-500/100 h-2 rounded-full" style={{width: '30%'}}></div></div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center"><DollarSign className="w-2 h-2 text-green-600"/></div>
                        <span className="text-sm text-gray-600">Inscripciones</span>
                      </div>
                      <span className="font-bold text-green-600">35</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: '10%'}}></div></div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Rentabilidad por Canal</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">Meta Ads</span>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">ROI 3X</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>CPL: $5.00</span>
                        <span>Inscripciones: 20</span>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">Google Ads</span>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">ROI 2.5X</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>CPL: $8.00</span>
                        <span>Inscripciones: 12</span>
                      </div>
                    </div>
                    <div className="p-4 border border-red-100 rounded-lg bg-red-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">LinkedIn Ads</span>
                        <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full">ROI Negativo</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>CPL: $12.00</span>
                        <span>Inscripciones: 3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'campanas' && (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Gestión de Campañas</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Registra y controla campañas por objetivo (Reclutamiento, Distribuidores, Alianzas), canal, presupuesto y responsable.
              </p>
            </div>
          )}

          {activeTab === 'trafico' && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Control de Tráfico y Leads</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Mide CPL, costo por cita, costo por inscripción, ROAS y conversión por fuente en tiempo real.
              </p>
            </div>
          )}

          {activeTab === 'organico' && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Gestión de Contenido Orgánico</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-2">
                Calendario de contenido, engagement, leads generados orgánicamente y tasa de conversión desde redes para la marca Kaivincia.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
