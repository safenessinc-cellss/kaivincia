import { useState } from 'react';
import { 
  ShoppingCart, Package, DollarSign, TrendingUp, 
  Download, Video, FileText, Users, Plus, Award, CreditCard, Settings, CheckCircle2
} from 'lucide-react';

export default function DigitalProducts() {
  const [activeTab, setActiveTab] = useState('membresia');

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Venta de Productos Digitales</h2>
          <p className="text-sm text-gray-500 mt-1">Gestión de infoproductos, membresías y upsells</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 flex items-center gap-2 shadow-sm">
            <Settings className="h-4 w-4" /> Configurar Pasarelas
          </button>
          <button className="bg-[#00F0FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF] flex items-center gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: 'membresia', label: 'Membresía Kaivincia PRO', icon: Award },
            { id: 'productos', label: 'Catálogo de Productos', icon: Package },
            { id: 'pagos', label: 'Sistema de Pagos', icon: CreditCard },
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
          
          {/* MEMBRESÍA KAIVINCIA PRO */}
          {activeTab === 'membresia' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 shadow-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        <Award className="w-8 h-8 text-[#00F0FF]" /> 
                        Membresía Kaivincia PRO <span className="text-xs bg-[#00F0FF] text-black px-2 py-1 rounded uppercase tracking-wider">Nivel Dios</span>
                      </h3>
                      <p className="text-gray-400 max-w-2xl">
                        Ingreso recurrente (MRR). Incluye actualizaciones legales USA, scripts de ventas avanzados, plantillas CRM y acceso exclusivo a la comunidad privada.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 mb-1">Suscripciones Activas</p>
                      <p className="text-3xl font-bold text-[#00F0FF]">1,245</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm text-gray-400 mb-1">Precio Mensual</p>
                      <p className="text-xl font-bold">$97 USD</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm text-gray-400 mb-1">Precio Anual</p>
                      <p className="text-xl font-bold">$997 USD <span className="text-xs text-green-400 ml-2">Ahorra $167</span></p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-sm text-gray-400 mb-1">MRR Generado</p>
                      <p className="text-xl font-bold text-green-400">$120,765 USD</p>
                    </div>
                  </div>

                  <button className="bg-[#00F0FF] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#00BFFF] transition-colors shadow-sm">
                    Configurar Membresía
                  </button>
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-10">
                  <Award className="w-96 h-96" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Beneficios Incluidos (Configuración)</h4>
                <div className="space-y-3">
                  {['Actualizaciones Legales USA (TCPA, DNC)', 'Nuevos Scripts de Ventas Mensuales', 'Plantillas de CRM y Embudos', 'Comunidad Privada (Discord/Slack)', 'Q&A Semanal con Expertos'].map((benefit, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-700">{benefit}</span>
                      </div>
                      <button className="text-sm text-gray-400 hover:text-[#00F0FF]">Editar</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CATÁLOGO DE PRODUCTOS */}
          {activeTab === 'productos' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Cursos Grabados</h3>
                <p className="text-sm text-gray-500 mb-4">Cursos de Appointment Setter, Call Center, Ventas 10X.</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900">4 Activos</span>
                  <button className="text-[#00F0FF] hover:underline">Gestionar</button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Descargables</h3>
                <p className="text-sm text-gray-500 mb-4">eBooks, Plantillas CRM, Scripts descargables.</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900">12 Activos</span>
                  <button className="text-[#00F0FF] hover:underline">Gestionar</button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">En Vivo & Mentorías</h3>
                <p className="text-sm text-gray-500 mb-4">Masterclass, Bootcamps en vivo, Mentorías privadas 1a1.</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900">2 Próximos</span>
                  <button className="text-[#00F0FF] hover:underline">Gestionar</button>
                </div>
              </div>
            </div>
          )}

          {/* SISTEMA DE PAGOS */}
          {activeTab === 'pagos' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Gestión de Upsells y Embudos</h3>
                <p className="text-gray-500 text-sm mb-6">Configura flujos de venta automatizados para maximizar el LTV (Life Time Value) del cliente.</p>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                    <div>
                      <h4 className="font-bold text-gray-900">Embudo: Certificación Setter Pro</h4>
                      <p className="text-sm text-gray-500">Producto Principal ($497) → Order Bump ($47) → Upsell 1 ($197)</p>
                    </div>
                    <button className="text-[#00F0FF] font-medium hover:underline text-sm">Editar Flujo</button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                    <div>
                      <h4 className="font-bold text-gray-900">Embudo: Membresía PRO</h4>
                      <p className="text-sm text-gray-500">Prueba 7 días ($1) → Suscripción Mensual ($97)</p>
                    </div>
                    <button className="text-[#00F0FF] font-medium hover:underline text-sm">Editar Flujo</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-400" /> Pasarelas de Pago</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium text-gray-900">Stripe</span>
                      </div>
                      <span className="text-xs text-gray-500">Activo (Principal)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium text-gray-900">PayPal</span>
                      </div>
                      <span className="text-xs text-gray-500">Activo (Secundario)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-gray-400" /> Suscripciones Recurrentes</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Suscripciones Activas</span>
                      <span className="font-bold text-gray-900">1,245</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tasa de Churn (Mensual)</span>
                      <span className="font-bold text-red-600">4.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Ingreso Recurrente (MRR)</span>
                      <span className="font-bold text-green-600">$120,765</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
