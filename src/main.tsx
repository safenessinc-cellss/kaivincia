import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalProvider } from './contexts/GlobalContext';
import { LanguageProvider } from './contexts/LanguageContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <GlobalProvider>
          <App />
        </GlobalProvider>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
);

