import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PrivacyNotifications from '../PrivacyNotifications';
import PrivacyStatusIndicator from '../PrivacyStatusIndicator';

// Mock the privacy context
vi.mock('@/contexts/PrivacyContext', () => ({
    usePrivacy: () => ({
        privacySettings: null,
        loading: false,
        error: null
    })
}));

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: 'test-user' }
    })
}));

describe('Privacy Navigation Components', () => {
    it('renders PrivacyStatusIndicator without errors', () => {
        render(<PrivacyStatusIndicator />);
        // Component should render without throwing errors
        expect(true).toBe(true);
    });

    it('renders PrivacyNotifications without errors', () => {
        render(<PrivacyNotifications />);
        // Component should render without throwing errors
        expect(true).toBe(true);
    });

    it('PrivacyStatusIndicator shows not configured status when no settings', () => {
        render(<PrivacyStatusIndicator showText={true} />);
        expect(screen.getByText('Not Configured')).toBeInTheDocument();
    });
});