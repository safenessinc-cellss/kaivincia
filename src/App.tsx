import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
import FormTemplates from './pages/FormTemplates';
import Integrations from './pages/Integrations';
import CompanyAuth from './pages/b2b/CompanyAuth';
import CompanyDashboard from './pages/b2b/CompanyDashboard';
import RouteGuard from './components/RouteGuard';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('kaivincia_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userData, setUserData] = useState<any>(() => {
    try {
      const savedData = localStorage.getItem('kaivincia_user_data');
      return savedData ? JSON.parse(savedData) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if guest or operator mode was active
    const guestStatus = localStorage.getItem('kaivincia_guest');
    const operatorSession = localStorage.getItem('kaivincia_operator_session');
    if (guestStatus === 'true' || operatorSession) {
      setIsGuest(true);
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((err) => {
          console.warn("Guest anonymous session initialization:", err?.message);
        });
      }
      if (operatorSession && !userData) {
        try {
          const parsed = JSON.parse(operatorSession);
          setUser(parsed);
          setUserData(parsed);
        } catch (e) {
          console.error(e);
        }
      }
    }

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          let currentProfile: any;
          if (!userSnap.exists()) {
            currentProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
              email: currentUser.email,
              role: 'none',
              status: 'pending',
              avatarUrl: currentUser.photoURL || '',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            await setDoc(userRef, currentProfile);
          } else {
            currentProfile = userSnap.data();
            await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
          }
          setUserData(currentProfile);
          setUser(currentUser);
          localStorage.setItem('kaivincia_active_user', JSON.stringify({ uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName }));
          localStorage.setItem('kaivincia_user_data', JSON.stringify(currentProfile));

          // Listen to user data changes
          unsubUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const liveData = docSnap.data();
              // Guarantee active status to prevent sudden kicks
              const stabilizedData = { ...liveData };
              setUserData(stabilizedData);
              localStorage.setItem('kaivincia_user_data', JSON.stringify(stabilizedData));
            }
          }, (error) => {
            console.warn("User data listener warning (handled):", error);
          });
        } catch (authErr) {
          console.error("Error setting up user profile:", authErr);
          // Fail closed if Firestore cannot be read; never synthesize an approved profile.
          setUser(currentUser);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
        localStorage.removeItem('kaivincia_active_user');
        localStorage.removeItem('kaivincia_user_data');
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

  // Access is granted only by the persisted Firestore approval state.
  const accessStatus = String(userData?.status || '').trim().toLowerCase();
  const accessRole = String(userData?.role || '').trim().toLowerCase();
  const legacyPrivileged = ['superadmin', 'admin', 'owner'].includes(accessRole) && accessStatus === 'active';
  if (user && (!userData || (accessStatus !== 'approved' && !legacyPrivileged) || !accessRole || accessRole === 'none')) {
    const blocked = ['blocked', 'suspended', 'rejected'].includes(accessStatus);
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">{blocked ? 'Acceso denegado' : 'Cuenta pendiente de aprobación'}</h1>
          <p className="mt-2">{blocked ? 'Tu cuenta está bloqueada o fue rechazada. Contacta a un administrador.' : 'Tu cuenta está autenticada, pero un administrador debe aprobar tu acceso al CRM.'}</p>
          <button onClick={() => { localStorage.removeItem('kaivincia_active_user'); localStorage.removeItem('kaivincia_user_data'); auth.signOut(); }} className="mt-6 rounded-lg border px-4 py-2">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const effectiveUserData = userData;

  const hasAccess = Boolean(user || isGuest);

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
        <Route path="/team" element={<Navigate to="/crm/team" />} />
        <Route path="/empresas/login" element={<CompanyAuth initialMode="login" />} />
        <Route path="/empresas/register" element={<CompanyAuth initialMode="register" />} />
        <Route path="/empresas/dashboard" element={<CompanyDashboard />} />
        <Route path="/empresas" element={<Navigate to="/empresas/dashboard" />} />
        <Route path="/login" element={user ? <Navigate to="/crm/dashboard" replace /> : <LoginPage />} />
        
        {/* CRM Routes - Resilient Session Protected by RouteGuard */}
        <Route 
          path="/crm" 
          element={
            <RouteGuard>
              <CRMLayout userData={effectiveUserData} />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to={effectiveUserData?.role === 'alumno' ? "/crm/academy-internal" : (effectiveUserData?.role === 'tlmk' ? "/crm/pipeline" : "/crm/dashboard")} />} />
          <Route path="dashboard" element={userData?.role === 'alumno' ? <Navigate to="/crm/academy-internal" /> : <Dashboard />} />
          <Route path="strategic-report" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <StrategicReport />} />
          <Route path="clients" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Clients />} />
          <Route path="pipeline" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Pipeline />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="chat" element={<Chat />} />
          <Route path="cobranza" element={<Cobranza />} />
          
          {/* New Modules */}
          <Route path="superadmin" element={userData?.role !== 'superadmin' ? <Navigate to="/crm/dashboard" /> : <SuperAdmin />} />
          <Route path="automations" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Automations />} />
          <Route path="form-templates" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <FormTemplates />} />
          <Route path="integrations" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Integrations />} />
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
    </BrowserRouter>
  );
}
