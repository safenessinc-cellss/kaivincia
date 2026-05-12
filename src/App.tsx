import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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
    return <div className="min-h-screen flex items-center justify-center bg-black text-[#00F0FF] font-bold text-xl">Cargando Kaivincia Corp...</div>;
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
          <Route index element={<Navigate to="/crm/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<StrategicReport />} />
          <Route path="clients" element={<Clients />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="chat" element={<Communications />} />
          <Route path="cobranza" element={<Cobranza />} />
          
          {/* New Modules */}
          <Route path="superadmin" element={<SuperAdmin />} />
          <Route path="automations" element={<Automations />} />
          <Route path="academy-internal" element={<AcademyInternal />} />
          <Route path="academy-external" element={<AcademyExternal />} />
          <Route path="digital-products" element={<DigitalProducts />} />
          <Route path="calls" element={<CallSystem />} />
          
          {/* Administrativo */}
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="client-management" element={<ClientManagement />} />
          <Route path="billing" element={<Billing />} />
          <Route path="operations" element={<Operations />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="projects" element={<Projects />} />
          <Route path="reports" element={<Reports />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="tactical" element={<TacticalDeployment />} />
          <Route path="manuales" element={<SOPManuals />} />
          <Route path="turs" element={<MasterForms />} />
          <Route path="helpdesk" element={<Helpdesk />} />
          <Route path="drive" element={<DocumentDrive />} />
          <Route path="audits" element={<AuditsSGI />} />
          <Route path="security" element={<SecurityCenter />} />
          <Route path="nervous" element={<NervousSystem />} />
          <Route path="strategy-blog" element={<StrategyBlog />} />
          
          {/* Portales */}
          <Route path="client-portal" element={<ClientPortal />} />
          <Route path="user-portal" element={<UserPortal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
