import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export interface DashboardConfig {
  widgets: Record<string, boolean>;
  widgetOrder: string[];
  updatedAt?: string;
}

export const DASHBOARD_WIDGETS = [
  { key: 'header', label: 'Header + Stats' },
  { key: 'mainContent', label: 'Gráficos y KPIs' },
  { key: 'sidebar', label: 'Feed de Eventos + Red Neuronal' },
  { key: 'footerMetrics', label: 'Métricas del Footer' },
] as const;

const ALL_KEYS = DASHBOARD_WIDGETS.map(w => w.key);

const DEFAULT_BY_ROLE: Record<string, DashboardConfig> = {
  superadmin: {
    widgets: { header: true, mainContent: true, sidebar: true, footerMetrics: true },
    widgetOrder: [...ALL_KEYS],
  },
  admin: {
    widgets: { header: true, mainContent: true, sidebar: true, footerMetrics: true },
    widgetOrder: [...ALL_KEYS],
  },
  supervisor: {
    widgets: { header: true, mainContent: true, sidebar: true, footerMetrics: false },
    widgetOrder: [...ALL_KEYS],
  },
  agente: {
    widgets: { header: true, mainContent: true, sidebar: false, footerMetrics: false },
    widgetOrder: [...ALL_KEYS],
  },
};

const FALLBACK: DashboardConfig = DEFAULT_BY_ROLE.agente;

export function getDefaultConfigForRole(role?: string | null): DashboardConfig {
  const r = String(role || '').toLowerCase().trim();
  return DEFAULT_BY_ROLE[r] || FALLBACK;
}

export function useDashboardConfig() {
  const { user, userData } = useAuth();
  const [config, setConfig] = useState<DashboardConfig>(() =>
    getDefaultConfigForRole(userData?.role)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const data = snap.data();
      if (data?.dashboardConfig) {
        setConfig(data.dashboardConfig);
      } else {
        setConfig(getDefaultConfigForRole(userData?.role));
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.uid, userData?.role]);

  const saveConfig = async (newConfig: DashboardConfig) => {
    if (!user?.uid) return;
    await setDoc(doc(db, 'users', user.uid), {
      dashboardConfig: { ...newConfig, updatedAt: new Date().toISOString() }
    }, { merge: true });
  };

  const resetConfig = async () => {
    const def = getDefaultConfigForRole(userData?.role);
    await saveConfig(def);
  };

  return { config, loading, saveConfig, resetConfig };
}
