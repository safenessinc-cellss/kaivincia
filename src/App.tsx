import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Apply from './pages/Apply';
import Careers from './pages/Careers';
import CRMLayout from './components/CRMLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import Communications from './pages/Communications';
import StrategicReport from './pages/StrategicReport';
import Cobranza from './pages/Cobranza';
import SuperAdmin from './pages/SuperAdmin';
import AcademyInternal from './pages/AcademyInternal';
import AcademyExternal from './pages/AcademyExternal';
import DigitalProducts from './pages/DigitalProducts';
import CallSystem from './pages/CallSystem';
import Recruitment from './pages/Recruitment';
import TeamManagement from './pages/TeamManagement';
import Payroll from './pages/Payroll';
import Accounting from './pages/Accounting';
import ClientManagement from './pages/ClientManagement';
import Billing from './pages/Billing';
import Operations from './pages/Operations';
import Marketing from './pages/Marketing';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Commissions from './pages/Commissions';
import ClientPortal from './pages/ClientPortal';
import UserPortal from './pages/UserPortal';
import CalendarView from './pages/CalendarView';
import Automations from './pages/Automations';
import StrategyBlog from './pages/StrategyBlog';
import TacticalDeployment from './pages/TacticalDeployment';
import SOPManuals from './pages/SOPManuals';
import MasterForms from './pages/MasterForms';
import Helpdesk from './pages/Helpdesk';
import DocumentDrive from './pages/DocumentDrive';
import SecurityCenter from './pages/SecurityCenter';
import AuditsSGI from './pages/AuditsSGI';
import NervousSystem from './pages/NervousSystem';
import FloatingEditButton from './components/FloatingEditButton';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if guest mode was active
    const guestStatus = localStorage.getItem('kaivincia_guest');
    if (guestStatus === 'true') setIsGuest(true);

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const isSuperAdmin = currentUser.email === 'safeness.c.a@gmail.com';
          await setDoc(userRef, {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Usuario',
            email: currentUser.email,
            role: isSuperAdmin ? 'superadmin' : 'user',
            status: isSuperAdmin ? 'active' : 'pending',
            avatarUrl: currentUser.photoURL || '',
            createdAt: new Date().toISOString()
          });
        }

        // Listen to user data changes (for status updates)
        unsubUserDoc = onSnapshot(userRef, (doc) => {
          setUserData(doc.data());
        });

        setUser(currentUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      unsubscribeAuth();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070a] relative flex flex-col items-center justify-center overflow-hidden">
        {/* Background stars */}
        <div className="absolute inset-0 z-0 opacity-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-white rounded-full absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Spaceship animation */}
        <div className="relative z-10 flex items-center h-32 w-full max-w-3xl justify-center">
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* The Text being revealed/formed */}
            <div className="relative overflow-hidden flex items-center">
              <motion.div
                className="absolute inset-y-0 right-0 bg-[#05070a] z-20 origin-right"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
              />
              <h1 className="text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#00F0FF] uppercase italic relative z-10">
                Kaivincia Corp
              </h1>
            </div>

            {/* Spaceship shooting */}
            <motion.div
              className="absolute text-[#00F0FF] right-0 z-30"
              initial={{ right: "100%", x: "0%" }}
              animate={{ right: "0%", x: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
            >
              {/* Laser beam */}
              <motion.div 
                className="absolute right-full top-1/2 -translate-y-1/2 h-0.5 bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]"
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
              />
              <svg className="w-12 h-12 rotate-90 drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If user is logged in but pending authorization
  if (user && userData && userData.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
          <div className="h-16 w-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cuenta en Revisión</h2>
          <p className="text-gray-600 mb-6">
            Tu cuenta ha sido registrada exitosamente. Un Super Administrador debe autorizar tu acceso antes de que puedas entrar al sistema.
          </p>
          <button onClick={() => auth.signOut()} className="text-blue-600 font-medium hover:underline">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (userData && userData.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00F0FF]/20 via-transparent to-transparent"></div>
        </div>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 max-w-lg"
        >
          <div className="w-24 h-24 bg-[#00F0FF]/10 rounded-3xl border border-[#00F0FF]/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-12 h-12 text-[#00F0FF]" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Acceso Pendiente</h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em] mb-8 leading-relaxed">
            Hola <span className="text-[#00F0FF]">{userData.name}</span>, tu cuenta ha sido registrada con éxito pero requiere activación manual por parte del equipo de <span className="text-white">Kaivincia Corp</span>. 
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <p className="text-gray-300 text-sm font-medium">
              Estamos verificando tu perfil para asignarte los permisos correspondientes. Recibirás acceso completo en breve.
            </p>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Cerrar Sesión
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage onGuestMode={() => {
          localStorage.setItem('kaivincia_guest', 'true');
          setIsGuest(true);
        }} />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/guest-academy" element={<AcademyExternal />} />
        <Route path="/strategy-blog" element={<StrategyBlog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/login" element={user ? <Navigate to="/crm/dashboard" /> : <LoginPage />} />
        
        {/* CRM Routes */}
        <Route path="/crm" element={user && userData?.status === 'active' ? <CRMLayout userData={userData} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to={userData?.role === 'alumno' ? "/crm/academy-internal" : "/crm/dashboard"} />} />
          <Route path="dashboard" element={userData?.role === 'alumno' ? <Navigate to="/crm/academy-internal" /> : <Dashboard />} />
          <Route path="reports" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <StrategicReport />} />
          <Route path="clients" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Clients />} />
          <Route path="pipeline" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Pipeline />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="chat" element={<Communications />} />
          <Route path="cobranza" element={<Cobranza />} />
          
          {/* New Modules */}
          <Route path="superadmin" element={userData?.role !== 'superadmin' ? <Navigate to="/crm/dashboard" /> : <SuperAdmin />} />
          <Route path="automations" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Automations />} />
          <Route path="academy-internal" element={<AcademyInternal />} />
          <Route path="academy-external" element={<AcademyExternal />} />
          <Route path="digital-products" element={<DigitalProducts />} />
          <Route path="calls" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <CallSystem />} />
          
          {/* Administrativo */}
          <Route path="recruitment" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Recruitment />} />
          <Route path="team" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <TeamManagement />} />
          <Route path="payroll" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Payroll />} />
          <Route path="accounting" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Accounting />} />
          <Route path="client-management" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <ClientManagement />} />
          <Route path="billing" element={<Billing />} />
          <Route path="operations" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Operations />} />
          <Route path="marketing" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Marketing />} />
          <Route path="projects" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Projects />} />
          <Route path="reports" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Reports />} />
          <Route path="commissions" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Commissions />} />
          <Route path="tactical" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <TacticalDeployment />} />
          <Route path="manuales" element={<SOPManuals />} />
          <Route path="turs" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <MasterForms />} />
          <Route path="helpdesk" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Helpdesk />} />
          <Route path="drive" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <DocumentDrive />} />
          <Route path="audits" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <AuditsSGI />} />
          <Route path="security" element={userData?.role !== 'superadmin' ? <Navigate to="/crm/dashboard" /> : <SecurityCenter />} />
          <Route path="nervous" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <NervousSystem />} />
          <Route path="strategy-blog" element={<StrategyBlog />} />
          
          {/* Portales */}
          <Route path="client-portal" element={<ClientPortal />} />
          <Route path="user-portal" element={<UserPortal />} />
        </Route>
      </Routes>
      <FloatingEditButton userData={userData} />
    </BrowserRouter>
  );
}
