import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditLogPanel from '../AuditLogPanel';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock the audit service
vi.mock('@/lib/auditService', () => ({
    auditService: {
        getAccessLogs: vi.fn().mockResolvedValue([]),
        detectSuspiciousActivity: vi.fn().mockResolvedValue([]),
        logPrivacyAction: vi.fn().mockResolvedValue(undefined),
        generateAuditReport: vi.fn().mockResolvedValue({
            id: 'test-report',
            userId: 'test-user',
            generatedAt: new Date(),
            dateRange: { startDate: new Date(), endDate: new Date() },
            filters: {},
            entries: [],
            summary: {
                totalEntries: 0,
                successfulAccess: 0,
                deniedAccess: 0,
                uniqueAccessors: 0,
                mostAccessedResource: 'none',
                suspiciousActivity: []
            },
            format: 'json' as const
        })
    }
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
    default: vi.fn().mockImplementation(() => ({
        setFontSize: vi.fn(),
        text: vi.fn(),
        autoTable: vi.fn(),
        save: vi.fn(),
        internal: {
            pageSize: {
                width: 210
            }
        }
    }))
}));

describe('AuditLogPanel', () => {
    const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: mockUser
        });
    });

    it('renders audit log panel with title', () => {
        render(<AuditLogPanel />);

        expect(screen.getByText('Privacy Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('View and filter your privacy-related activity logs')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
        render(<AuditLogPanel />);

        expect(screen.getByText('Loading audit logs...')).toBeInTheDocument();
    });

    it('renders filter and export buttons', () => {
        render(<AuditLogPanel />);

        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });

    it('renders table headers', async () => {
        render(<AuditLogPanel />);

        // Wait for component to load
        await screen.findByText('Date/Time');

        expect(screen.getByText('Date/Time')).toBeInTheDocument();
        expect(screen.getByText('Accessor')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
        expect(screen.getByText('Resource')).toBeInTheDocument();
        expect(screen.getByText('Result')).toBeInTheDocument();
        expect(screen.getByText('IP Address')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
    });
});