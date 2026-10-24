import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalProvider } from './contexts/GlobalContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { applyAppearanceToDOM, DEFAULT_APPEARANCE } from './constants/appearance';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <GlobalProvider>
          <AppearanceProvider>
            <App />
          </AppearanceProvider>
        </GlobalProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
);

// Aplicar apariencia por defecto al arranque
applyAppearanceToDOM(DEFAULT_APPEARANCE);
