import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useServiceWorker } from './hooks/useServiceWorker';
import ErrorBoundary from './components/ErrorBoundary';
import { initSecureStorage } from './lib/secureStorageService';
import { initAnalytics } from './lib/firebase';
import { initNativeUI } from './lib/capacitor';

const Main = () => {
  useServiceWorker();

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

let started = false;
const startApp = () => {
  if (started) return;
  started = true;
  initAnalytics();
  initNativeUI();
  ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
};

// Don't let secure storage init block the entire app from rendering
initSecureStorage().then(startApp).catch(startApp);
// Safety net: render anyway if plugin hangs after 3s
setTimeout(startApp, 3000);
