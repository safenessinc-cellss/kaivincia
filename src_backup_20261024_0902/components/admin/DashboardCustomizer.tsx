import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Save, RotateCcw, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useDashboardConfig, DASHBOARD_WIDGETS, DashboardConfig } from '../../hooks/useDashboardConfig';

export default function DashboardCustomizer() {
  const navigate = useNavigate();
  const { config, loading, saveConfig, resetConfig } = useDashboardConfig();
  const [draft, setDraft] = useState<DashboardConfig>(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(config); }, [config]);

  const toggleWidget = (key: string) => {
    setDraft(prev => ({
      ...prev,
      widgets: { ...prev.widgets, [key]: !prev.widgets[key] },
    }));
  };

  const moveWidget = (key: string, dir: -1 | 1) => {
    setDraft(prev => {
      const order = [...prev.widgetOrder];
      const idx = order.indexOf(key);
      if (idx === -1) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= order.length) return prev;
      [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
      return { ...prev, widgetOrder: order };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(draft);
      alert('Configuración del dashboard guardada.');
      navigate('/crm/dashboard');
    } catch (err: any) {
      alert(`Error guardando: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Restablecer la configuración por defecto de tu rol?')) return;
    setSaving(true);
    try {
      await resetConfig();
      alert('Configuración restablecida.');
      navigate('/crm/dashboard');
    } catch (err: any) {
      alert(`Error restableciendo: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400">Cargando configuración...</div>;
  }

  const orderedWidgets = draft.widgetOrder
    .map(key => DASHBOARD_WIDGETS.find(w => w.key === key))
    .filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/crm/dashboard')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-cyan-400" />
              Personalizar Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Elige qué widgets ver y en qué orden. Solo afecta a tu cuenta.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
        {orderedWidgets.map((w, i) => (
          <div
            key={w.key}
            className="flex items-center justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2"
          >
            <label className="flex items-center gap-2 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!draft.widgets[w.key]}
                onChange={() => toggleWidget(w.key)}
                className="w-4 h-4 accent-cyan-500"
              />
              <span className="text-sm font-bold text-white">{w.label}</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveWidget(w.key, -1)}
                disabled={i === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-30"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveWidget(w.key, 1)}
                disabled={i === orderedWidgets.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 disabled:opacity-30"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer
        </button>
      </div>
    </div>
  );
}
