import { useState } from 'react';
import { 
  ShoppingCart, Package, DollarSign, TrendingUp, 
  Download, Video, FileText, Users, Plus, Award, CreditCard, Settings, CheckCircle2, X
} from 'lucide-react';

export default function DigitalProducts() {
  const [activeTab, setActiveTab] = useState('membresia');
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isConfigMembershipOpen, setIsConfigMembershipOpen] = useState(false);
  const [membershipPrice, setMembershipPrice] = useState(97);
  const [membershipPeriod, setMembershipPeriod] = useState('Mensual');
  const [benefits, setBenefits] = useState([
    'Actualizaciones Legales USA (TCPA, DNC)',
    'Nuevos Scripts de Ventas Mensuales',
    'Plantillas de CRM y Embudos',
    'Comunidad Privada (Discord/Slack)',
    'Q&A Semanal con Expertos'
  ]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Cursos');
  const [newProductPrice, setNewProductPrice] = useState('97');

  const [productsList, setProductsList] = useState([
    { id: 1, title: 'Master en Appointment Setting', category: 'Cursos', price: '$497', sales: 342, type: 'video' },
    { id: 2, title: 'SuperPack Scripts Telefónicos TLMK', category: 'Descargables', price: '$47', sales: 1280, type: 'download' },
    { id: 3, title: 'Bootcamp Intensivo Cierre 1a1', category: 'En Vivo', price: '$997', sales: 88, type: 'users' },
  ]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName) return;
    setProductsList(prev => [
      ...prev,
      {
        id: Date.now(),
        title: newProductName,
        category: newProductCategory,
        price: `$${newProductPrice}`,
        sales: 0,
        type: newProductCategory === 'Cursos' ? 'video' : newProductCategory === 'Descargables' ? 'download' : 'users'
      }
    ]);
    setNewProductName('');
    setIsNewProductOpen(false);
    setActiveTab('productos');
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Venta de Productos Digitales</h2>
          <p className="text-sm text-gray-500 mt-1">Gestión de infoproductos, membresías y upsells</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('pagos')}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
            <Settings className="h-4 w-4" /> Configurar Pasarelas
          </button>
          <button 
            onClick={() => setIsNewProductOpen(true)}
            className="bg-[#00F0FF] text-black hover:bg-[#00d0df] px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
          >
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

                  <button 
                    onClick={() => setIsConfigMembershipOpen(true)}
                    className="bg-[#00F0FF] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#00d0df] transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    Configurar Membresía
                  </button>
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-10">
                  <Award className="w-96 h-96" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-gray-900">Beneficios Incluidos (Configuración)</h4>
                  <button 
                    onClick={() => {
                      const newB = prompt('Ingresa nuevo beneficio:');
                      if (newB) setBenefits(prev => [...prev, newB]);
                    }}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200 cursor-pointer"
                  >
                    + Agregar Beneficio
                  </button>
                </div>
                <div className="space-y-3">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-700">{benefit}</span>
                      </div>
                      <button 
                        onClick={() => setBenefits(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CATÁLOGO DE PRODUCTOS */}
          {activeTab === 'productos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {productsList.map(prod => (
                  <div key={prod.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center mb-4">
                        {prod.type === 'video' && <Video className="w-6 h-6" />}
                        {prod.type === 'download' && <Download className="w-6 h-6" />}
                        {prod.type === 'users' && <Users className="w-6 h-6" />}
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 mb-2 inline-block">
                        {prod.category}
                      </span>
                      <h3 className="font-bold text-gray-900 mb-1">{prod.title}</h3>
                      <p className="text-2xl font-black text-gray-900 mb-4">{prod.price}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-100">
                      <span className="font-medium text-gray-500">{prod.sales} Ventas</span>
                      <button 
                        onClick={() => setProductsList(prev => prev.filter(p => p.id !== prod.id))}
                        className="text-xs text-red-500 font-bold hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
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

      {/* MODAL NUEVO PRODUCTO */}
      {isNewProductOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-900">Crear Nuevo Producto Digital</h3>
              <button onClick={() => setIsNewProductOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nombre del Producto</label>
                <input 
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ej. Masterclass en Negociación..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoría</label>
                <select 
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="Cursos">Cursos Grabados</option>
                  <option value="Descargables">Material Descargable / Ebook</option>
                  <option value="En Vivo">En Vivo / Mentoría</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Precio ($ USD)</label>
                <input 
                  type="number"
                  required
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="97"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsNewProductOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00F0FF] text-black font-black rounded-xl text-xs hover:bg-[#00d0df] cursor-pointer"
                >
                  Publicar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN MEMBRESÍA */}
      {isConfigMembershipOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-900">Configuración de Membresía PRO</h3>
              <button onClick={() => setIsConfigMembershipOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Precio Regular ($ USD)</label>
                <input 
                  type="number"
                  value={membershipPrice}
                  onChange={(e) => setMembershipPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Periodo de Facturación</label>
                <select 
                  value={membershipPeriod}
                  onChange={(e) => setMembershipPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="Mensual">Mensual ($97/mes)</option>
                  <option value="Trimestral">Trimestral ($249/trimestre)</option>
                  <option value="Anual">Anual ($997/año)</option>
                </select>
              </div>
              <button 
                onClick={() => setIsConfigMembershipOpen(false)}
                className="w-full py-2.5 bg-[#00F0FF] text-black font-black rounded-xl text-xs hover:bg-[#00d0df] cursor-pointer mt-4"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
