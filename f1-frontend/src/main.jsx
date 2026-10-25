import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.jsx';
import { CursorProvider } from './context/CursorContext';
import { SoundProvider } from './context/SoundContext';
import { BadgeProvider } from './context/BadgeContext';

function AppRoot() {
  useEffect(() => {
    // ✅ FIX SCROLL : nettoie un overflow:hidden orphelin au démarrage
    // (peut arriver si une modale crash avant de restaurer body.overflow)
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  return (
    <SoundProvider>
      <CursorProvider>
        <BadgeProvider>
          <App />
        </BadgeProvider>
      </CursorProvider>
    </SoundProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
);