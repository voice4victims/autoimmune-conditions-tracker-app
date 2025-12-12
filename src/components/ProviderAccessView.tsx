import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { magicLinkService } from '@/lib/firebaseService';
import { MagicLink } from '@/types/magicLink';
import {
    Shield,
    User,
    Activity,
    Pill,
    Heart,
    FileText,
    BarChart3,
    Download,
    Clock,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

export const ProviderAccessView: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [magicLink, setMagicLink] = useState<MagicLink | null>(null);
    const [childData, setChildData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [providerInfo, setProviderInfo] = useState({
        name: '',
        organization: ''
    });

    useEffect(() => {
        if (token) {
            validateAndLoadData();
        }
    }, [token]);

    const validateAndLoadData = async () => {
        try {
            // Validate magic link
            const linkData = await magicLinkService.validateMagicLink(token!);
            setMagicLink(linkData as MagicLink);

            // Record access
            await magicLinkService.recordAccess(linkData.id, {
                ip_address: await getClientIP(),
                user_agent: navigator.userAgent,
                provider_info: providerInfo
            });

            // Load child data based on permissions
            const data = await magicLinkService.getChildDataForProvider(linkData.id, linkData.permissions);
            setChildData(data);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Access denied');
        } finally {
            setLoading(false);
        }
    };

    const getClientIP = async (): Promise<string | null> => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return null;
        }
    };

    const updateProviderInfo = () => {
        if (providerInfo.name || providerInfo.organization) {
            magicLinkService.recordAccess(magicLink!.id, {
                provider_info: providerInfo
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Validating access...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md mx-auto">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-blue-600" />
                                    Medical Provider Access
                                </CardTitle>
                                <p className="text-muted-foreground mt-1">
                                    Secure access to {childData?.child_profile?.name}'s medical data
                                </p>
                            </div>
                            <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Authorized Access
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="font-medium">Provider: {magicLink?.provider_name}</p>
                                {magicLink?.provider_email && (
                                    <p className="text-muted-foreground">{magicLink.provider_email}</p>
                                )}
                            </div>
                            <div>
                                <p className="font-medium">Access Expires:</p>
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(magicLink?.expires_at || ''), 'MMM d, yyyy HH:mm')}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium">Access Count:</p>
                                <p className="text-muted-foreground">
                                    {magicLink?.access_count} / {magicLink?.max_access_count || '∞'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Provider Info Form */}
                {(!providerInfo.name && !providerInfo.organization) && (
                    <Card className="mb-6 border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                            <h4 className="font-semibold mb-3">Please identify yourself (Optional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={providerInfo.name}
                                    onChange={(e) => setProviderInfo(prev => ({ ...prev, name: e.target.value }))}
                                    className="px-3 py-2 border rounded-md"
                                />
                                <input
                                    type="text"
                                    placeholder="Organization/Hospital"
                                    value={providerInfo.organization}
                                    onChange={(e) => setProviderInfo(prev => ({ ...prev, organization: e.target.value }))}
                                    className="px-3 py-2 border rounded-md"
                                />
                            </div>
                            <Button onClick={updateProviderInfo} className="mt-3" size="sm">
                                Update Info
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Child Profile */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Patient Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">Name: {childData?.child_profile?.name}</p>
                                <p className="text-muted-foreground">Age: {childData?.child_profile?.age}</p>
                            </div>
                            <div>
                                <p className="font-medium">Diagnosis: {childData?.child_profile?.diagnosis || 'Not specified'}</p>
                                <p className="text-muted-foreground">
                                    Profile created: {format(new Date(childData?.child_profile?.created_at || ''), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Tabs */}
                <Tabs defaultValue="symptoms" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                        {magicLink?.permissions.includes('view_symptoms') && (
                            <TabsTrigger value="symptoms" className="flex items-center gap-1">
                                <Activity className="w-4 h-4" />
                                <span className="hidden sm:inline">Symptoms</span>
                            </TabsTrigger>
                        )}
                        {magicLink?.permissions.includes('view_treatments') && (
                            <TabsTrigger value="treatments" className="flex items-center gap-1">
                                <Pill className="w-4 h-4" />
                                <span className="hidden sm:inline">Treatments</span>
                            </TabsTrigger>
                        )}
                        {magicLink?.permissions.includes('view_vitals') && (
                            <TabsTrigger value="vitals" className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span className="hidden sm:inline">Vitals</span>
                            </TabsTrigger>
                        )}
                        {magicLink?.permissions.includes('view_notes') && (
                            <TabsTrigger value="notes" className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Notes</span>
                            </TabsTrigger>
                        )}
                        {magicLink?.permissions.includes('view_files') && (
                            <TabsTrigger value="files" className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Files</span>
                            </TabsTrigger>
                        )}
                        {magicLink?.permissions.includes('view_analytics') && (
                            <TabsTrigger value="analytics" className="flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Analytics</span>
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Symptoms Tab */}
                    {magicLink?.permissions.includes('view_symptoms') && (
                        <TabsContent value="symptoms">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Symptom History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {childData?.symptoms?.length > 0 ? (
                                        <div className="space-y-3">
                                            {childData.symptoms.slice(0, 20).map((symptom: any) => (
                                                <div key={symptom.id} className="border rounded-lg p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-medium">{symptom.symptomType}</h4>
                                                        <Badge variant={symptom.severity > 7 ? 'destructive' : symptom.severity > 4 ? 'default' : 'secondary'}>
                                                            Severity: {symptom.severity}/10
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(symptom.date), 'MMM d, yyyy')}
                                                    </p>
                                                    {symptom.notes && (
                                                        <p className="text-sm mt-2">{symptom.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No symptom data available.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Add other tab contents similarly */}
                </Tabs>

                {/* Export Button */}
                {magicLink?.permissions.includes('export_data') && (
                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <Button className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Export Medical Data
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};