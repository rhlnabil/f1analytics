import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.jsx';
import { CursorProvider } from './context/CursorContext';
import { SoundProvider } from './context/SoundContext';
import { BadgeProvider } from './context/BadgeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SoundProvider>
      <CursorProvider>
        <BadgeProvider>
          <App />
        </BadgeProvider>
      </CursorProvider>
    </SoundProvider>
  </StrictMode>
);