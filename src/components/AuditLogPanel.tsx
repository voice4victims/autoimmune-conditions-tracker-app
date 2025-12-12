import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Download, Filter, AlertTriangle, Eye, Search, Calendar, User, Activity, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/lib/auditService';
import { AccessLog, LogFilters, SuspiciousActivity, PrivacyAction, AccessResult } from '@/types/privacy';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface AuditLogPanelProps {
    className?: string;
}

const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ className }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AccessLog[]>([]);
    const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Filter states
    const [filters, setFilters] = useState<LogFilters>({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Load logs and suspicious activity
    const loadData = useCallback(async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            setError(null);

            const [logsData, suspiciousData] = await Promise.all([
                auditService.getAccessLogs(user.uid, filters),
                auditService.detectSuspiciousActivity(user.uid)
            ]);

            setLogs(logsData);
            setSuspiciousActivity(suspiciousData);

            // Log the access to audit logs
            await auditService.logPrivacyAction(user.uid, 'view_data', {
                resourceType: 'audit_logs',
                details: 'User viewed audit log panel'
            });
        } catch (err) {
            console.error('Error loading audit data:', err);
            setError('Failed to load audit logs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, filters]);

    // Apply search filter to logs
    useEffect(() => {
        let filtered = logs;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = logs.filter(log =>
                log.accessorName.toLowerCase().includes(term) ||
                log.action.toLowerCase().includes(term) ||
                log.resourceType.toLowerCase().includes(term) ||
                (log.details && log.details.toLowerCase().includes(term))
            );
        }

        setFilteredLogs(filtered);
    }, [logs, searchTerm]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (key: keyof LogFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
        });
        setSearchTerm('');
    };

    const exportToPDF = async () => {
        if (!user?.uid) return;

        try {
            setExportLoading(true);

            const report = await auditService.generateAuditReport(
                user.uid,
                {
                    startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    endDate: filters.endDate || new Date()
                },
                filters
            );

            // Create PDF
            const pdf = new jsPDF();
            const pageWidth = pdf.internal.pageSize.width;

            // Header
            pdf.setFontSize(20);
            pdf.text('Privacy Audit Report', pageWidth / 2, 20, { align: 'center' });

            pdf.setFontSize(12);
            pdf.text(`Generated: ${format(report.generatedAt, 'PPpp')}`, 20, 35);
            pdf.text(`Period: ${format(report.dateRange.startDate, 'PP')} - ${format(report.dateRange.endDate, 'PP')}`, 20, 45);

            // Summary
            pdf.setFontSize(14);
            pdf.text('Summary', 20, 65);
            pdf.setFontSize(10);
            pdf.text(`Total Entries: ${report.summary.totalEntries}`, 20, 75);
            pdf.text(`Successful Access: ${report.summary.successfulAccess}`, 20, 85);
            pdf.text(`Denied Access: ${report.summary.deniedAccess}`, 20, 95);
            pdf.text(`Unique Accessors: ${report.summary.uniqueAccessors}`, 20, 105);

            // Suspicious Activity
            if (report.summary.suspiciousActivity.length > 0) {
                pdf.setFontSize(14);
                pdf.text('Suspicious Activity', 20, 125);
                pdf.setFontSize(10);
                let yPos = 135;
                report.summary.suspiciousActivity.forEach((activity, index) => {
                    pdf.text(`${index + 1}. ${activity.description} (${activity.severity})`, 20, yPos);
                    yPos += 10;
                });
            }

            // Access Logs Table
            const tableData = report.entries.map(log => [
                format(log.timestamp, 'MM/dd/yyyy HH:mm'),
                log.accessorName,
                log.action,
                log.resourceType,
                log.result,
                log.ipAddress || 'N/A'
            ]);

            pdf.autoTable({
                head: [['Date/Time', 'Accessor', 'Action', 'Resource', 'Result', 'IP Address']],
                body: tableData,
                startY: report.summary.suspiciousActivity.length > 0 ? 155 : 125,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] }
            });

            // Save PDF
            pdf.save(`privacy-audit-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        } catch (err) {
            console.error('Error exporting PDF:', err);
            setError('Failed to export audit report. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const getActionIcon = (action: PrivacyAction) => {
        switch (action) {
            case 'view_data':
                return <Eye className="h-4 w-4" />;
            case 'edit_data':
                return <Activity className="h-4 w-4" />;
            case 'export_data':
                return <Download className="h-4 w-4" />;
            case 'delete_data':
                return <AlertTriangle className="h-4 w-4" />;
            case 'grant_access':
            case 'revoke_access':
                return <User className="h-4 w-4" />;
            case 'update_privacy_settings':
            case 'consent_change':
                return <Shield className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    const getResultBadge = (result: AccessResult) => {
        const variants = {
            success: 'default',
            denied: 'destructive',
            error: 'secondary',
            partial: 'outline'
        } as const;

        return (
            <Badge variant={variants[result] || 'secondary'}>
                {result}
            </Badge>
        );
    };

    const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
        const variants = {
            low: 'secondary',
            medium: 'outline',
            high: 'destructive'
        } as const;

        return (
            <Badge variant={variants[severity]}>
                {severity.toUpperCase()}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Audit Logs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">Loading audit logs...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            {/* Suspicious Activity Alerts */}
            {suspiciousActivity.length > 0 && (
                <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="font-medium mb-2">Suspicious Activity Detected</div>
                        <div className="space-y-2">
                            {suspiciousActivity.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm">{activity.description}</span>
                                    {getSeverityBadge(activity.severity)}
                                </div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Privacy Audit Logs
                            </CardTitle>
                            <CardDescription>
                                View and filter your privacy-related activity logs
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToPDF}
                                disabled={exportLoading}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {exportLoading ? 'Exporting...' : 'Export PDF'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {/* Filters Section */}
                    <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                        <CollapsibleContent>
                            <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="search">Search</Label>
                                        <Input
                                            id="search"
                                            placeholder="Search logs..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="action">Action</Label>
                                        <Select
                                            value={filters.action || ''}
                                            onValueChange={(value) => handleFilterChange('action', value || undefined)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All actions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All actions</SelectItem>
                                                <SelectItem value="view_data">View Data</SelectItem>
                                                <SelectItem value="edit_data">Edit Data</SelectItem>
                                                <SelectItem value="export_data">Export Data</SelectItem>
                                                <SelectItem value="delete_data">Delete Data</SelectItem>
                                                <SelectItem value="grant_access">Grant Access</SelectItem>
                                                <SelectItem value="revoke_access">Revoke Access</SelectItem>
                                                <SelectItem value="update_privacy_settings">Update Privacy Settings</SelectItem>
                                                <SelectItem value="consent_change">Consent Change</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="result">Result</Label>
                                        <Select
                                            value={filters.result || ''}
                                            onValueChange={(value) => handleFilterChange('result', value || undefined)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All results" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All results</SelectItem>
                                                <SelectItem value="success">Success</SelectItem>
                                                <SelectItem value="denied">Denied</SelectItem>
                                                <SelectItem value="error">Error</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant="outline" size="sm" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                    <Button size="sm" onClick={loadData}>
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {error && (
                        <Alert className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Logs Table */}
                    <div className="border rounded-lg">
                        <ScrollArea className="h-[500px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date/Time</TableHead>
                                        <TableHead>Accessor</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Resource</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No audit logs found for the selected criteria
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {format(log.timestamp, 'MM/dd/yyyy HH:mm:ss')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">{log.accessorName}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {log.accessorType}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getActionIcon(log.action)}
                                                        <span className="capitalize">
                                                            {log.action.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{log.resourceType}</div>
                                                        {log.resourceId && (
                                                            <div className="text-xs text-muted-foreground font-mono">
                                                                {log.resourceId}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getResultBadge(log.result)}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {log.ipAddress || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {log.details && (
                                                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                                                            {log.details}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {filteredLogs.length} of {logs.length} entries
                        </div>
                        <div>
                            Last updated: {format(new Date(), 'PPpp')}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditLogPanel;