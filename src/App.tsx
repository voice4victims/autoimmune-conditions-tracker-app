import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import AppLayout from './components/AppLayout';
import MobileOptimizations from './components/MobileOptimizations';
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
        <AppProvider>
          <Router>
            <Routes>
              <Route path="*" element={<AppContent />} />
            </Routes>
          </Router>
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;