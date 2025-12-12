import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/AppLayout';
import MobileOptimizations from './components/MobileOptimizations';
import { ProviderAccessView } from './components/ProviderAccessView';
import './App.css';

const AppContent: React.FC = () => {
  return (
    <>
      <MobileOptimizations />
      <AppLayout />
    </>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="pandas-ui-theme">
      <AuthProvider>
        <PrivacyProvider>
          <AppProvider>
            <Router>
              <Routes>
                <Route path="/provider-access/:token" element={<ProviderAccessView />} />
                <Route path="*" element={<AppContent />} />
              </Routes>
            </Router>
            <Toaster />
          </AppProvider>
        </PrivacyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;