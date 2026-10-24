// Wrapper delgado: reemplaza el panel viejo por el ThemeModule nuevo.
// Acepta cualquier prop extra para no romper el mount actual en CRMLayout.
import React from 'react';
import ThemeModule from '../settings/ThemeModule';
import type { AppearanceSettings } from '../../constants/appearance';

interface AppearancePanelProps {
  initial?: AppearanceSettings;
  onSave?: (settings: AppearanceSettings) => void;
  [key: string]: unknown;
}

export default function AppearancePanel(props: AppearancePanelProps) {
  const { initial, onSave } = props;
  return <ThemeModule initial={initial} onSave={onSave} />;
}
