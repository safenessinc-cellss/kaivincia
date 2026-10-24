import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalProvider } from './contexts/GlobalContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppearanceProvider } from './contexts/AppearanceContext';

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
