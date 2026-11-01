import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
import DashboardCustomizer from './components/admin/DashboardCustomizer';
import PendingApproval from './pages/PendingApproval';
import Clients from './pages/Clients';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import StrategicReport from './pages/StrategicReport';
import Cobranza from './pages/Cobranza';
import SuperAdmin from './pages/SuperAdmin';
import AppearancePanel from './components/admin/AppearancePanel';
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
import CallCenterAdmin from './pages/CallCenterAdmin';
import RouteGuard from "./components/RouteGuard";
import { normalizeRole } from "./constants/roles";
export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('kaivincia_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userData, setUserData] = useState<any>(null);
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [rbacMatrixLoaded, setRbacMatrixLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check if guest or operator mode was active
    const guestStatus = localStorage.getItem('kaivincia_guest');
    const operatorSession = localStorage.getItem('kaivincia_operator_session');
    if (guestStatus === 'true' || operatorSession) {
      setIsGuest(true);
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
    let unsubRbacMatrix: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (unsubRbacMatrix) {
        unsubRbacMatrix();
        unsubRbacMatrix = null;
      }

      if (currentUser) {
        setRbacMatrixLoaded(false);
        unsubRbacMatrix = onSnapshot(doc(db, 'settings', 'rbac_matrix'), (matrixSnap) => {
          const matrix = matrixSnap.exists() ? matrixSnap.data().matrix : null;
          setRbacMatrix(matrix && typeof matrix === 'object' ? matrix : null);
          setRbacMatrixLoaded(true);
        }, (matrixError) => {
          console.warn('RBAC matrix unavailable; using safe role defaults:', matrixError);
          setRbacMatrix(null);
          setRbacMatrixLoaded(true);
        });
        try {
          // The trusted backend owns account provisioning and approval. Never promote
          // users or change role/status from client-side login code.
          const token = await currentUser.getIdToken();
          await fetch('/api/auth/bootstrap-user', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });

          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const profile = userSnap.data();
            setUserData(profile);
            unsubUserDoc = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()) setUserData(docSnap.data());
            }, (error) => console.warn("User data listener warning:", error));
          } else {
            // Fail closed if the backend could not provision a profile.
            setUserData({
              uid: currentUser.uid,
              name: currentUser.displayName || "Usuario",
              email: currentUser.email,
              role: "none",
              status: "pending"
            });
          }
          setUser(currentUser);
          localStorage.setItem("kaivincia_active_user", JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName
          }));
        } catch (authErr) {
          console.error("Error setting up user profile:", authErr);
          setUser(currentUser);
          setUserData({
            uid: currentUser.uid,
            name: currentUser.displayName || "Usuario",
            email: currentUser.email,
            role: "none",
            status: "pending"
          });
        }
      } else {
        setRbacMatrix(null);
        setRbacMatrixLoaded(true);
        setUser(null);
        setUserData(null);
        localStorage.removeItem('kaivincia_active_user');
        localStorage.removeItem('kaivincia_user_data');
      }
      setLoading(false);
    });

    return () => {
      if (unsubUserDoc) unsubUserDoc();
      if (unsubRbacMatrix) unsubRbacMatrix();
      unsubscribeAuth();
    };
  }, []);

  if (loading || (user && !rbacMatrixLoaded)) {
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

  // Usuario logueado pero pendiente de aprobación → pantalla de espera (sin auto-activación)
  if (user && userData && (userData.status === 'pending' || !userData.role || userData.role === 'none')) {
    return <PendingApproval />;
  }

  // Never synthesize an operational role for an identity without a CRM profile.
  const effectiveUserData = userData || {
    name: user?.displayName || 'Usuario',
    email: user?.email || '',
    role: 'none',
    status: 'pending'
  };

  const hasAccess = Boolean(user || isGuest);

  // Apply per-user overrides first, then the persisted role matrix, and only
  // then the documented role defaults for legacy profiles without a matrix.
  const canAccessPermission = (permissionId: string, fallbackRoles: string[]) => {
    const role = normalizeRole(effectiveUserData?.role);
    const userOverride = effectiveUserData?.permissions?.[permissionId];
    if (typeof userOverride === 'boolean') return userOverride;

    const roleMatrix = rbacMatrix?.[role] || (role === 'agent' ? rbacMatrix?.sales : undefined);
    const matrixValue = roleMatrix?.[permissionId];
    if (typeof matrixValue === 'boolean') return matrixValue;

    return fallbackRoles.includes(role);
  };

  const requirePermission = (permissionId: string, fallbackRoles: string[], element: ReactNode) =>
    canAccessPermission(permissionId, fallbackRoles)
      ? element
      : <Navigate to="/crm/dashboard" replace />;

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
          <Route index element={<Navigate to={normalizeRole(effectiveUserData?.role) === 'alumno' ? "/crm/academy-internal" : (normalizeRole(effectiveUserData?.role) === 'agent' ? "/crm/pipeline" : "/crm/dashboard")} />} />
          <Route path="dashboard" element={userData?.role === 'alumno' ? <Navigate to="/crm/academy-internal" /> : <Dashboard />} />
          <Route path="dashboard/customize" element={<DashboardCustomizer />} />
          <Route path="strategic-report" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <StrategicReport />} />
          <Route path="clients" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Clients />} />
          <Route path="pipeline" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Pipeline />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="chat" element={<Chat />} />
          <Route path="cobranza" element={requirePermission('view_financial_dashboard', ['superadmin', 'admin', 'ceo', 'gestor'], <Cobranza />)} />
          <Route path="call-center" element={requirePermission('telephony_config', ['superadmin', 'admin'], <CallCenterAdmin />)} />
          
          {/* New Modules */}
          <Route path="superadmin" element={userData?.role !== 'superadmin' ? <Navigate to="/crm/dashboard" /> : <SuperAdmin />} />
          <Route path="appearance" element={userData?.role !== 'superadmin' && userData?.role !== 'admin' ? <Navigate to="/crm/dashboard" /> : <AppearancePanel />} />
          <Route path="automations" element={requirePermission('automations_engine', ['superadmin', 'admin', 'ceo', 'gestor'], <Automations />)} />
          <Route path="form-templates" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <FormTemplates />} />
          <Route path="integrations" element={requirePermission('telephony_config', ['superadmin', 'admin'], <Integrations />)} />
          <Route path="academy-internal" element={<AcademyInternal />} />
          <Route path="academy-external" element={<AcademyExternal />} />
          <Route path="digital-products" element={<DigitalProducts />} />
          <Route path="calls" element={requirePermission('voip_calls', ['superadmin', 'admin', 'ceo', 'gestor', 'agent', 'collaborator'], <CallSystem />)} />
          
          {/* Administrativo */}
          <Route path="recruitment" element={requirePermission('recruitment_payroll', ['superadmin', 'admin', 'ceo', 'rrhh'], <Recruitment />)} />
          <Route path="team" element={requirePermission('recruitment_payroll', ['superadmin', 'admin', 'ceo', 'rrhh'], <TeamManagement />)} />
          <Route path="payroll" element={requirePermission('recruitment_payroll', ['superadmin', 'admin', 'ceo', 'rrhh'], <Payroll />)} />
          <Route path="accounting" element={requirePermission('accounting_gps', ['superadmin', 'admin', 'ceo'], <Accounting />)} />
          <Route path="client-management" element={requirePermission('client_base_global', ['superadmin', 'admin', 'ceo', 'gestor'], <ClientManagement />)} />
          <Route path="billing" element={requirePermission('accounting_gps', ['superadmin', 'admin', 'ceo'], <Billing />)} />
          <Route path="operations" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Operations />} />
          <Route path="marketing" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Marketing />} />
          <Route path="projects" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Projects />} />
          <Route path="reports" element={requirePermission('export_databases', ['superadmin', 'admin', 'ceo', 'gestor'], <Reports />)} />
          <Route path="commissions" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Commissions />} />
          <Route path="tactical" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <TacticalDeployment />} />
          <Route path="manuales" element={<SOPManuals />} />
          <Route path="turs" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <MasterForms />} />
          <Route path="helpdesk" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <Helpdesk />} />
          <Route path="drive" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <DocumentDrive />} />
          <Route path="audits" element={userData?.role === 'alumno' ? <Navigate to="/crm/user-portal" /> : <AuditsSGI />} />
          <Route path="security" element={requirePermission('security_center', ['superadmin', 'admin', 'ceo'], <SecurityCenter />)} />
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
