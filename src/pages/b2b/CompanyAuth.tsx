import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, Briefcase, Mail, Lock, ShieldCheck, ArrowRight, 
  Sparkles, CheckCircle2, ChevronRight, User, Phone, Globe, Layers
} from 'lucide-react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function CompanyAuth({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = initialMode === 'register' || location.pathname.includes('register');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register Form State
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('Tecnología & SaaS');
  const [selectedPlan, setSelectedPlan] = useState<'saas_basic' | 'managed_premium'>('saas_basic');
  const [password, setPassword] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!companyName || !email || !password || !contactName) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const companyData = {
        companyName,
        taxId: taxId || 'B-Pending',
        contactName,
        email: email.toLowerCase().trim(),
        phone,
        industry,
        plan: selectedPlan,
        status: 'active',
        createdAt: new Date().toISOString(),
        verified: true,
      };

      try {
        const docRef = await addDoc(collection(db, 'company_profiles'), companyData);
        localStorage.setItem('kaivincia_company_session', JSON.stringify({ id: docRef.id, ...companyData }));
      } catch (firestoreErr) {
        // Fallback for offline / demo mode
        console.warn('Firestore offline fallback for company profile:', firestoreErr);
        localStorage.setItem('kaivincia_company_session', JSON.stringify({ id: 'comp-' + Date.now(), ...companyData }));
      }

      navigate('/empresas/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Por favor ingresa tu email corporativo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      // Check in Firestore or local mock
      let foundCompany: any = null;
      try {
        const q = query(collection(db, 'company_profiles'), where('email', '==', loginEmail.toLowerCase().trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          foundCompany = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      } catch {
        // Continue to fallback
      }

      if (!foundCompany) {
        // Demo corporate account for testing
        foundCompany = {
          id: 'comp-demo',
          companyName: loginEmail.split('@')[0].toUpperCase() + ' Corp',
          email: loginEmail,
          contactName: 'Director de Selección',
          taxId: 'B-87654321',
          industry: 'Ventas B2B & Consultoría',
          plan: 'saas_basic',
          status: 'active'
        };
      }

      localStorage.setItem('kaivincia_company_session', JSON.stringify(foundCompany));
      navigate('/empresas/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-200 flex flex-col justify-between selection:bg-cyan-500/30 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-black text-black text-lg">
              K
            </div>
            <div>
              <span className="text-lg font-black text-white uppercase italic tracking-tighter">Kaivincia</span>
              <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">B2B Empresas</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/careers" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
              Portal Candidatos
            </Link>
            <Link 
              to={isRegister ? "/empresas/login" : "/empresas/register"}
              className="text-xs font-bold text-cyan-400 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all"
            >
              {isRegister ? 'Iniciar Sesión B2B' : 'Crear Cuenta Empresa'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plataforma de Contratación con IA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight italic leading-tight">
              Recluta el 1% del Talento con <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Inteligencia Artificial</span>
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed font-normal">
              Publica vacantes laborales, recibe candidatos pre-evaluados por Gemini AI y reduce el tiempo de contratación en un 70% con nuestro algoritmo de coincidencia curricular.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'IA Match Scoring 0-100%', desc: 'Análisis instantáneo de adecuación al perfil del puesto' },
                { title: 'Modelos Flexibles', desc: 'SaaS de autogestión o servicio gestionado llave en mano' },
                { title: 'Fábrica de Talento Certificado', desc: 'Acceso prioritario a graduados de la Academia Kaivincia' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">{item.title}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form Box */}
          <div className="lg:col-span-7">
            <div className="bg-[#0e121a] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    {isRegister ? 'Registro de Empresa' : 'Acceso Empresas'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {isRegister ? 'Configura tu portal de selección corporativo' : 'Ingresa tus credenciales para gestionar tus vacantes'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {isRegister ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Razón Social / Nombre Empresa *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej. InnovaTech Global S.L."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        CIF / NIF / Tax ID
                      </label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="B-12345678"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Responsable de Selección / Contacto *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ej. Marina Delgado"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Teléfono de Contacto
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 600 123 456"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Email Corporativo *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="reclutamiento@empresa.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Sector / Industria
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-4 py-3 bg-[#131822] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="Tecnología & SaaS">Tecnología & SaaS</option>
                        <option value="Ventas B2B & Telemarketing">Ventas B2B & Telemarketing</option>
                        <option value="Operaciones & Logística">Operaciones & Logística</option>
                        <option value="Finanzas & Fintech">Finanzas & Fintech</option>
                        <option value="Consultoría Estratégica">Consultoría Estratégica</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Contraseña de Acceso *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  {/* Plan Selector */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Modelo de Contratación Inicial
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div 
                        onClick={() => setSelectedPlan('saas_basic')}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedPlan === 'saas_basic' 
                            ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg' 
                            : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold uppercase">SaaS Autogestión</span>
                          <span className="text-xs font-extrabold text-cyan-400">199€/mes</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Publica vacantes y filtra candidatos con IA autónomamente.</p>
                      </div>

                      <div 
                        onClick={() => setSelectedPlan('managed_premium')}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedPlan === 'managed_premium' 
                            ? 'bg-blue-950/40 border-blue-400 text-white shadow-lg' 
                            : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold uppercase">Servicio Gestionado</span>
                          <span className="text-xs font-extrabold text-blue-400">750€ + % éxito</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Headhunter IA Kaivincia dedicado con garantía de reemplazo 90 días.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Creando Empresa...' : 'Registrar Empresa y Comenzar'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Email Corporativo
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="director@tuempresa.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-gray-400">
                    <span className="font-bold text-cyan-400">Demo Instantánea:</span> Puedes ingresar cualquier email corporativo para explorar el panel B2B de inmediato.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Accediendo...' : 'Entrar al Panel B2B'}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <p className="text-xs text-gray-400">
                  {isRegister ? '¿Ya tienes una cuenta de empresa?' : '¿Tu empresa aún no está registrada?'}
                  <Link
                    to={isRegister ? '/empresas/login' : '/empresas/register'}
                    className="ml-2 font-bold text-cyan-400 hover:underline"
                  >
                    {isRegister ? 'Iniciar Sesión' : 'Crear Cuenta Gratis'}
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6 text-center text-xs text-gray-500">
        <p>© 2026 Kaivincia Marketplace B2B • Reclutamiento Inteligente con IA</p>
      </footer>
    </div>
  );
}
