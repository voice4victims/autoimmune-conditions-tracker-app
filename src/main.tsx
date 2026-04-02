import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useServiceWorker } from './hooks/useServiceWorker';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/theme-provider';
import ErrorBoundary from './components/ErrorBoundary';
import { initSecureStorage } from './lib/secureStorageService';
import { initAnalytics } from './lib/firebase';

const Main = () => {
  useServiceWorker();

  return (
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

initSecureStorage().then(() => {
  initAnalytics();
  ReactDOM.createRoot(document.getElementById('root')!).render(<Main />);
});
