import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataSharingPanel from '../DataSharingPanel';
import { DataSharingPreferences } from '@/types/privacy';

// Mock data
const mockDataSharing: DataSharingPreferences = {
    researchParticipation: false,
    anonymizedDataSharing: true,
    thirdPartyIntegrations: {
        'test-service': true
    },
    marketingConsent: false,
    consentHistory: [
        {
            id: '1',
            consentType: 'anonymized_data_sharing',
            granted: true,
            timestamp: new Date('2024-01-01'),
            version: '1.0'
        }
    ]
};

describe('DataSharingPanel', () => {
    const mockOnUpdate = vi.fn();

    beforeEach(() => {
        mockOnUpdate.mockClear();
    });

    it('renders data sharing preferences correctly', () => {
        render(
            <DataSharingPanel
                dataSharing={mockDataSharing}
                onUpdate={mockOnUpdate}
            />
        );

        expect(screen.getByText('Research Participation')).toBeInTheDocument();
        expect(screen.getByText('Anonymized Data Sharing')).toBeInTheDocument();
        expect(screen.getByText('Third-Party Integrations')).toBeInTheDocument();
        expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
    });

    it('shows correct consent status badges', () => {
        render(
            <DataSharingPanel
                dataSharing={mockDataSharing}
                onUpdate={mockOnUpdate}
            />
        );

        // Research participation is false, should show "Not Granted"
        const badges = screen.getAllByText('Not Granted');
        expect(badges.length).toBeGreaterThan(0);

        // Anonymized data sharing is true, should show "Granted"
        expect(screen.getByText('Granted')).toBeInTheDocument();
    });

    it('opens confirmation dialog when consent is changed', async () => {
        render(
            <DataSharingPanel
                dataSharing={mockDataSharing}
                onUpdate={mockOnUpdate}
            />
        );

        // Find and click the research participation switch
        const researchSwitch = screen.getByLabelText(/Allow anonymized data sharing for research/i);
        fireEvent.click(researchSwitch);

        // Should open confirmation dialog
        await waitFor(() => {
            expect(screen.getByText('Confirm Consent Change')).toBeInTheDocument();
        });
    });

    it('displays consent history when available', () => {
        render(
            <DataSharingPanel
                dataSharing={mockDataSharing}
                onUpdate={mockOnUpdate}
            />
        );

        expect(screen.getByText('Consent History')).toBeInTheDocument();
        expect(screen.getByText('Anonymized data sharing')).toBeInTheDocument();
    });

    it('shows research information dialog when learn more is clicked', async () => {
        render(
            <DataSharingPanel
                dataSharing={mockDataSharing}
                onUpdate={mockOnUpdate}
            />
        );

        const learnMoreButton = screen.getByText('Learn More About Research');
        fireEvent.click(learnMoreButton);

        await waitFor(() => {
            expect(screen.getByText('Research Participation Information')).toBeInTheDocument();
        });
    });
});