import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { HIPAAComplianceService } from '@/lib/hipaaCompliance';
import {
    Shield,
    FileText,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Download,
    Settings
} from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource_type: string;
    timestamp: Date;
    success: boolean;
    details?: string;
    phi_accessed?: boolean;
}

interface ComplianceMetrics {
    totalAuditLogs: number;
    phiAccessCount: number;
    failedAccessAttempts: number;
    activeUsers: number;
    lastRiskAssessment: Date | null;
}

const HIPAAComplianceDashboard: React.FC = () => {
    const { user } = useAuth();
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [metrics, setMetrics] = useState<ComplianceMetrics>({
        totalAuditLogs: 0,
        phiAccessCount: 0,
        failedAccessAttempts: 0,
        activeUsers: 0,
        lastRiskAssessment: null
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (user) {
            loadComplianceData();
        }
    }, [user]);

    const loadComplianceData = async () => {
        try {
            setLoading(true);

            // In a real implementation, you would fetch this data from Firebase
            // For now, we'll simulate the data structure

            const mockAuditLogs: AuditLog[] = [
                {
                    id: '1',
                    user_id: user?.uid || '',
                    action: 'view_phi',
                    resource_type: 'symptoms',
                    timestamp: new Date(),
                    success: true,
                    details: 'Viewed symptom data',
                    phi_accessed: true
                },
                {
                    id: '2',
                    user_id: user?.uid || '',
                    action: 'login',
                    resource_type: 'authentication',
                    timestamp: new Date(Date.now() - 3600000),
                    success: true,
                    details: 'User login',
                    phi_accessed: false
                }
            ];

            const mockMetrics: ComplianceMetrics = {
                totalAuditLogs: 156,
                phiAccessCount: 89,
                failedAccessAttempts: 3,
                activeUsers: 4,
                lastRiskAssessment: new Date(Date.now() - 86400000 * 30) // 30 days ago
            };

            setAuditLogs(mockAuditLogs);
            setMetrics(mockMetrics);
        } catch (error) {
            console.error('Error loading compliance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRiskAssessment = async () => {
        try {
            await HIPAAComplianceService.conductRiskAssessment();
            // Reload data after assessment
            await loadComplianceData();
        } catch (error) {
            console.error('Error conducting risk assessment:', error);
        }
    };

    const handleAccessReview = async () => {
        try {
            await HIPAAComplianceService.conductAccessReview();
            // Show success message
            alert('Access review completed successfully');
        } catch (error) {
            console.error('Error conducting access review:', error);
        }
    };

    const handleDataRetention = async () => {
        try {
            await HIPAAComplianceService.implementDataRetention();
            // Show success message
            alert('Data retention policy applied successfully');
        } catch (error) {
            console.error('Error implementing data retention:', error);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login':
            case 'logout':
                return <Shield className="w-4 h-4" />;
            case 'view_phi':
            case 'create_phi':
            case 'update_phi':
                return <Eye className="w-4 h-4" />;
            case 'access_denied':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const getActionBadgeColor = (action: string, success: boolean) => {
        if (!success) return 'destructive';

        switch (action) {
            case 'login':
                return 'default';
            case 'view_phi':
            case 'create_phi':
            case 'update_phi':
                return 'secondary';
            case 'logout':
                return 'outline';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Loading compliance data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">HIPAA Compliance Dashboard</h2>
                    <p className="text-gray-600">Monitor security, audit logs, and compliance status</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Compliant
                </Badge>
            </div>

            {/* Compliance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Audit Logs</p>
                                <p className="text-2xl font-bold">{metrics.totalAuditLogs}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">PHI Access Events</p>
                                <p className="text-2xl font-bold">{metrics.phiAccessCount}</p>
                            </div>
                            <Eye className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Failed Attempts</p>
                                <p className="text-2xl font-bold">{metrics.failedAccessAttempts}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
                            </div>
                            <Shield className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Assessment Alert */}
            {metrics.lastRiskAssessment &&
                new Date().getTime() - metrics.lastRiskAssessment.getTime() > 86400000 * 90 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Risk assessment is overdue. Last assessment was conducted on{' '}
                            {metrics.lastRiskAssessment.toLocaleDateString()}.
                            HIPAA requires regular risk assessments.
                        </AlertDescription>
                    </Alert>
                )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Security Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Encryption</span>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Audit Logging</span>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Access Controls</span>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Session Timeout</span>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        <Clock className="w-3 h-3 mr-1" />
                                        15 min
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-48">
                                    <div className="space-y-3">
                                        {auditLogs.slice(0, 5).map((log) => (
                                            <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                                {getActionIcon(log.action)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {log.action.replace('_', ' ').toUpperCase()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {log.timestamp.toLocaleString()}
                                                    </p>
                                                </div>
                                                <Badge variant={getActionBadgeColor(log.action, log.success)}>
                                                    {log.success ? 'Success' : 'Failed'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="audit-logs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audit Log History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-2">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                            {getActionIcon(log.action)}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{log.action.replace('_', ' ').toUpperCase()}</span>
                                                    <Badge variant={getActionBadgeColor(log.action, log.success)}>
                                                        {log.success ? 'Success' : 'Failed'}
                                                    </Badge>
                                                    {log.phi_accessed && (
                                                        <Badge variant="secondary">PHI</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">{log.resource_type}</p>
                                                <p className="text-xs text-gray-500">{log.timestamp.toLocaleString()}</p>
                                                {log.details && (
                                                    <p className="text-xs text-gray-400 mt-1">{log.details}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Administrative Safeguards</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Security Officer</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Workforce Training</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Access Management</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Incident Procedures</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Physical Safeguards</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Device Controls</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Workstation Security</span>
                                    <Badge variant="outline">User Responsibility</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Facility Access</span>
                                    <Badge variant="outline">N/A (Mobile)</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Technical Safeguards</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Access Control</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Audit Controls</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Integrity</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Transmission Security</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compliance Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={handleRiskAssessment} className="w-full justify-start">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Conduct Risk Assessment
                                </Button>
                                <Button onClick={handleAccessReview} variant="outline" className="w-full justify-start">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Review User Access
                                </Button>
                                <Button onClick={handleDataRetention} variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Apply Data Retention
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Reports & Export</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button variant="outline" className="w-full justify-start">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Audit Logs
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Compliance Report
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Security Assessment Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HIPAAComplianceDashboard;