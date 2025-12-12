import React from 'react';
import PrivacySettings from '../PrivacySettings';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '../theme-provider';

/**
 * Demo component for testing PrivacySettings component
 * This can be used for manual testing and development
 */
const PrivacySettingsDemo: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="light" storageKey="privacy-demo-theme">
            <AuthProvider>
                <AppProvider>
                    <div className="min-h-screen bg-gray-50 p-8">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-3xl font-bold mb-8 text-center">Privacy Settings Demo</h1>
                            <PrivacySettings />
                        </div>
                    </div>
                </AppProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default PrivacySettingsDemo;