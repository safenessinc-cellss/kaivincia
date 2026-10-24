import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
  Radio,
  HelpCircle,
  Share2,
  Smartphone,
  Globe,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MetaConfig, MetaChannel } from '../../types/meta';

const DEFAULT_CONFIG: MetaConfig = {
  appId: '',
  appSecretMasked: '',
  verifyTokenMasked: 'kaiv••••••••••••2026',
  webhookUrl: 'https://www.kaivinciacorp.com/api/meta-webhook',
  whatsapp: {
    configured: false,
    status: 'not_configured'
  },
  facebook: {
    configured: false,
    status: 'not_configured'
  },
  instagram: {
    configured: false,
    status: 'not_configured'
  },
  updatedAt: new Date().toISOString()
};

export default function MetaAdminHub() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'connection' | 'whatsapp' | 'facebook_instagram' | 'guide'>('connection');

  // Configuración cargada desde el backend
  const [config, setConfig] = useState<MetaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Estados de formularios para actualización
  const [appIdInput, setAppIdInput] = useState('');
  const [appSecretInput, setAppSecretInput] = useState('');
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [verifyTokenInput, setVerifyTokenInput] = useState('kaivincia-meta-verify-2026');

  // WhatsApp
  const [waPhoneIdInput, setWaPhoneIdInput] = useState('');
  const [waBusinessIdInput, setWaBusinessIdInput] = useState('');
  const [waTokenInput, setWaTokenInput] = useState('');
  const [isEditingWaToken, setIsEditingWaToken] = useState(false);

  // Facebook
  const [fbPageIdInput, setFbPageIdInput] = useState('');
  const [fbPageTokenInput, setFbPageTokenInput] = useState('');
  const [isEditingFbToken, setIsEditingFbToken] = useState(false);

  // Instagram
  const [igAccountIdInput, setIgAccountIdInput] = useState('');
  const [igTokenInput, setIgTokenInput] = useState('');
  const [isEditingIgToken, setIsEditingIgToken] = useState(false);

  // Diagnóstico / Test de Conexión
  const [isTesting, setIsTesting] = useState(false);
  const [testingChannel, setTestingChannel] = useState<MetaChannel | 'all'>('all');
  const [testResults, setTestResults] = useState<{
    success: boolean;
    results: Record<string, { success: boolean; message: string; data?: any }>;
  } | null>(null);

  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedVerifyToken, setCopiedVerifyToken] = useState(false);

  // Cargar configuración desde el backend API
  const fetchConfig = async () => {
    setLoading(true);
    try {
      let token = '';
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {
          console.warn('Could not get Firebase ID token:', e);
        }
      }

      const res = await fetch('/api/meta-config', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Dev-UID': user?.uid || 'admin-user'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setAppIdInput(data.appId || '');
        setWaPhoneIdInput(data.whatsapp?.phoneNumberId || '');
        setWaBusinessIdInput(data.whatsapp?.businessAccountId || '');
        setFbPageIdInput(data.facebook?.pageId || '');
        setIgAccountIdInput(data.instagram?.accountId || '');
      } else {
        // Fallback a Firestore si la API reporta error transitorio
        const snap = await getDoc(doc(db, 'settings_integrations', 'meta'));
        if (snap.exists()) {
          const fsData = snap.data() as MetaConfig;
          setConfig(prev => ({ ...prev, ...fsData }));
        }
      }
    } catch (err) {
      console.warn('Error fetching meta config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [user]);

  // Probar Conexión con Meta Graph API
  const handleTestConnection = async (channel?: MetaChannel) => {
    setIsTesting(true);
    setTestingChannel(channel || 'all');
    setTestResults(null);

    try {
      let token = '';
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {}
      }

      const res = await fetch('/api/meta-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Dev-UID': user?.uid || 'admin-user'
        },
        body: JSON.stringify({ channel })
      });

      const data = await res.json();
      setTestResults(data);
    } catch (err: any) {
      setTestResults({
        success: false,
        results: {
          general: {
            success: false,
            message: `Error de red al contactar /api/meta-config: ${err.message}`
          }
        }
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Guardar Configuración
  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      let token = '';
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (e) {}
      }

      const payload: any = {
        appId: appIdInput.trim(),
        verifyToken: verifyTokenInput.trim()
      };

      if (appSecretInput.trim()) payload.appSecret = appSecretInput.trim();

      // WhatsApp
      if (waPhoneIdInput.trim()) payload.whatsappPhoneNumberId = waPhoneIdInput.trim();
      if (waBusinessIdInput.trim()) payload.whatsappBusinessAccountId = waBusinessIdInput.trim();
      if (waTokenInput.trim()) payload.whatsappAccessToken = waTokenInput.trim();

      // Facebook
      if (fbPageIdInput.trim()) payload.facebookPageId = fbPageIdInput.trim();
      if (fbPageTokenInput.trim()) payload.facebookPageAccessToken = fbPageTokenInput.trim();

      // Instagram
      if (igAccountIdInput.trim()) payload.instagramAccountId = igAccountIdInput.trim();
      if (igTokenInput.trim()) payload.instagramAccessToken = igTokenInput.trim();

      const res = await fetch('/api/meta-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Dev-UID': user?.uid || 'admin-user'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success && result.config) {
        setConfig(result.config);
        setIsEditingSecret(false);
        setAppSecretInput('');
        setIsEditingWaToken(false);
        setWaTokenInput('');
        setIsEditingFbToken(false);
        setFbPageTokenInput('');
        setIsEditingIgToken(false);
        setIgTokenInput('');

        // Backup de estado en Firestore
        await setDoc(doc(db, 'settings_integrations', 'meta'), result.config, { merge: true }).catch(() => {});

        setSaveSuccessMsg(t('meta.saved_success', '¡Configuración de Meta guardada y aplicada exitosamente!'));
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(result.error || 'Error al guardar configuración');
      }
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(config.webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleCopyVerifyToken = () => {
    navigator.clipboard.writeText(verifyTokenInput);
    setCopiedVerifyToken(true);
    setTimeout(() => setCopiedVerifyToken(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Administración Meta */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 rounded-3xl border border-emerald-500/20 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight italic">
                    {t('meta.title', 'Administración Meta & Canales de Mensajería')}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Graph API v21.0
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {t('meta.subtitle', 'Control centralizado de WhatsApp Business, Facebook Messenger e Instagram Messaging sin exponer tokens ni depender de desarrolladores.')}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas del Banner */}
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleTestConnection()}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : 'text-emerald-400'}`} />
              <span>{isTesting ? t('meta.testing', 'Probando...') : t('meta.test_all', 'Probar Conexión')}</span>
            </button>

            <button
              type="button"
              onClick={fetchConfig}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? t('meta.syncing', 'Sincronizando...') : t('meta.sync', 'Sincronizar')}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Estado por Canal (3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-slate-800/80">
          {/* WhatsApp */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">WhatsApp Business</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {config.whatsapp.phoneNumberId ? `ID: ${config.whatsapp.phoneNumberId}` : 'Sin ID'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              config.whatsapp.configured
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {config.whatsapp.configured ? 'Conectado' : 'No Configurado'}
            </span>
          </div>

          {/* Facebook */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">Facebook Messenger</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {config.facebook.pageId ? `Page: ${config.facebook.pageId}` : 'Sin Page ID'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              config.facebook.configured
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {config.facebook.configured ? 'Conectado' : 'No Configurado'}
            </span>
          </div>

          {/* Instagram */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-white block">Instagram Messaging</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {config.instagram.accountId ? `Account: ${config.instagram.accountId}` : 'Sin Account ID'}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              config.instagram.configured
                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {config.instagram.configured ? 'Conectado' : 'No Configurado'}
            </span>
          </div>
        </div>

        {/* Notificación de Resultado de Test */}
        {testResults && (
          <div className="mt-4 p-4 rounded-2xl border bg-slate-950/90 border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Resultados de Diagnóstico Meta Graph API:</span>
              </strong>
              <button
                type="button"
                onClick={() => setTestResults(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              {Object.entries(testResults.results).map(([key, val]) => (
                <div key={key} className={`p-2.5 rounded-xl border ${
                  val.success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}>
                  <strong className="uppercase block font-sans font-bold">{key}</strong>
                  <span>{val.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navegación por Sub-Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'connection', label: '1. Conexión & Webhooks', icon: ShieldCheck, badge: 'General' },
          { id: 'whatsapp', label: '2. WhatsApp Business', icon: Smartphone, badge: config.whatsapp.configured ? 'Activo' : 'Pendiente' },
          { id: 'facebook_instagram', label: '3. Facebook & Instagram', icon: Globe, badge: config.facebook.configured || config.instagram.configured ? 'Activo' : 'Pendiente' },
          { id: 'guide', label: '4. Guía de Configuración', icon: HelpCircle, badge: 'Docs' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-black/20 text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mensaje de éxito al guardar */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* PESTAÑA 1: CONEXIÓN & WEBHOOKS */}
      {activeSubTab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Credenciales Principales de la App en Meta</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Valores de la aplicación creada en <strong>developers.facebook.com</strong> para autenticar las llamadas a Graph API.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  META_APP_ID
                </label>
                <input
                  type="text"
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value)}
                  placeholder="Ej. 123456789012345"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* App Secret */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>META_APP_SECRET</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Cifrado en Backend
                  </span>
                </div>

                {!isEditingSecret ? (
                  <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="font-mono text-xs text-slate-400 font-bold tracking-wider select-none">
                      {config.appSecretMasked || '••••••••••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingSecret(true)}
                      className="text-xs font-black uppercase text-emerald-500 hover:text-emerald-400 underline cursor-pointer"
                    >
                      Reemplazar Secreto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={appSecretInput}
                      onChange={(e) => setAppSecretInput(e.target.value)}
                      placeholder="Pega aquí el nuevo App Secret de Meta"
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-500/60 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { setIsEditingSecret(false); setAppSecretInput(''); }}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Verify Token */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  META_VERIFY_TOKEN (Para suscripción de Webhook)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyTokenInput}
                    onChange={(e) => setVerifyTokenInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyVerifyToken}
                    className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 flex items-center gap-1.5"
                  >
                    {copiedVerifyToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVerifyToken ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Credenciales'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta de Webhook */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Webhook URL de Kaivincia
                </h5>
                <span className="text-[10px] text-slate-400">Configuración en Meta Developers</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pega esta URL en el panel de <strong>Webhooks</strong> de tu aplicación en Meta for Developers:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="font-mono text-xs text-emerald-300 break-all select-all">
                {config.webhookUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedWebhook ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡URL Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Webhook URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
              <strong className="text-white block">Campos a suscribir en Meta:</strong>
              <div>• <strong>WhatsApp:</strong> <code className="text-emerald-400">messages</code></div>
              <div>• <strong>Messenger:</strong> <code className="text-blue-400">messages</code>, <code className="text-blue-400">messaging_postbacks</code></div>
              <div>• <strong>Instagram:</strong> <code className="text-pink-400">messages</code></div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: WHATSAPP BUSINESS */}
      {activeSubTab === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp Business Cloud API</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configura el número y credenciales permanentes de WhatsApp Business Cloud API.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleTestConnection('whatsapp')}
              disabled={isTesting}
              className="px-4 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Probar WhatsApp</span>
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  WHATSAPP_PHONE_NUMBER_ID
                </label>
                <input
                  type="text"
                  value={waPhoneIdInput}
                  onChange={(e) => setWaPhoneIdInput(e.target.value)}
                  placeholder="Ej. 109876543210987"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  WHATSAPP_BUSINESS_ACCOUNT_ID (WABA ID)
                </label>
                <input
                  type="text"
                  value={waBusinessIdInput}
                  onChange={(e) => setWaBusinessIdInput(e.target.value)}
                  placeholder="Ej. 987654321098765"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Token Permanente de WhatsApp */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WHATSAPP_ACCESS_TOKEN (Token de Usuario del Sistema)</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Permanente
                </span>
              </div>

              {!isEditingWaToken ? (
                <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl">
                  <span className="font-mono text-xs text-slate-400 font-bold tracking-wider select-none">
                    {config.whatsapp.configured ? 'EAA••••••••••••••••••••••••' : 'No configurado'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingWaToken(true)}
                    className="text-xs font-black uppercase text-emerald-500 hover:text-emerald-400 underline cursor-pointer"
                  >
                    Reemplazar Token
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="password"
                    value={waTokenInput}
                    onChange={(e) => setWaTokenInput(e.target.value)}
                    placeholder="Pega el System User Access Token (EAA...)"
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-500/60 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setIsEditingWaToken(false); setWaTokenInput(''); }}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar WhatsApp'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA 3: FACEBOOK & INSTAGRAM */}
      {activeSubTab === 'facebook_instagram' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facebook Page */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Globe className="w-4 h-4" />
                <h5 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Facebook Messenger
                </h5>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection('facebook')}
                disabled={isTesting}
                className="px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase"
              >
                Probar FB
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  FACEBOOK_PAGE_ID
                </label>
                <input
                  type="text"
                  value={fbPageIdInput}
                  onChange={(e) => setFbPageIdInput(e.target.value)}
                  placeholder="Ej. 123456789012345"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  FACEBOOK_PAGE_ACCESS_TOKEN
                </label>
                {!isEditingFbToken ? (
                  <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="font-mono text-xs text-slate-400">
                      {config.facebook.pageAccessTokenMasked || '••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingFbToken(true)}
                      className="text-xs font-black uppercase text-blue-400 underline"
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={fbPageTokenInput}
                    onChange={(e) => setFbPageTokenInput(e.target.value)}
                    placeholder="Pega el Page Access Token"
                    className="w-full bg-slate-950 border border-blue-500/60 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs uppercase tracking-wider"
                >
                  Guardar Facebook
                </button>
              </div>
            </form>
          </div>

          {/* Instagram Messaging */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-400">
                <Send className="w-4 h-4" />
                <h5 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Instagram Messaging
                </h5>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection('instagram')}
                disabled={isTesting}
                className="px-3 py-1 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-bold uppercase"
              >
                Probar IG
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  INSTAGRAM_ACCOUNT_ID
                </label>
                <input
                  type="text"
                  value={igAccountIdInput}
                  onChange={(e) => setIgAccountIdInput(e.target.value)}
                  placeholder="Ej. 17841400000000000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  INSTAGRAM_ACCESS_TOKEN
                </label>
                {!isEditingIgToken ? (
                  <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
                    <span className="font-mono text-xs text-slate-400">
                      {config.instagram.accessTokenMasked || '••••••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingIgToken(true)}
                      className="text-xs font-black uppercase text-pink-400 underline"
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={igTokenInput}
                    onChange={(e) => setIgTokenInput(e.target.value)}
                    placeholder="Pega el Instagram Access Token"
                    className="w-full bg-slate-950 border border-pink-500/60 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-black text-xs uppercase tracking-wider"
                >
                  Guardar Instagram
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: GUÍA DE CONFIGURACIÓN */}
      {activeSubTab === 'guide' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
              Guía Paso a Paso para Conectar Meta for Developers con Kaivincia
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sigue estas instrucciones para obtener credenciales permanentes de WhatsApp Business, Facebook e Instagram.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Paso 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">1</span>
              <h5 className="text-xs font-bold uppercase text-white">Crear App en Meta</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ingresa a <strong>developers.facebook.com</strong>, crea una aplicación de tipo <em>Business (Negocios)</em> y añade los productos <strong>WhatsApp</strong> y <strong>Messenger</strong>.
              </p>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 font-bold inline-flex items-center gap-1 hover:underline"
              >
                <span>Ir a Meta Apps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Paso 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">2</span>
              <h5 className="text-xs font-bold uppercase text-white">Token Permanente</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                En <strong>business.facebook.com</strong> &gt; <em>Usuarios del Sistema</em>, crea un usuario con rol de Administrador y genera un token permanente con permisos <code className="text-emerald-300">whatsapp_business_messaging</code> y <code className="text-emerald-300">pages_messaging</code>.
              </p>
              <a
                href="https://business.facebook.com/settings/system-users"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 font-bold inline-flex items-center gap-1 hover:underline"
              >
                <span>System Users</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Paso 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">3</span>
              <h5 className="text-xs font-bold uppercase text-white">Configurar Webhook</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                En tu app de Meta, pega la URL: <code className="text-emerald-300">{config.webhookUrl}</code> y el Verify Token <code className="text-emerald-300">{verifyTokenInput}</code>. Suscríbete al campo <code className="text-emerald-300">messages</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
