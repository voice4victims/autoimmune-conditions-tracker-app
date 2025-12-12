import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Database,
    Users,
    Shield,
    Download,
    FileText,
    Info,
    Building,
    Scale,
    Clock,
    CheckCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { privacyService } from '@/lib/privacyService';

interface DataCategory {
    name: string;
    description: string;
    dataTypes: string[];
    purpose: string;
    legalBasis: string;
    retentionPeriod: string;
    icon: React.ReactNode;
}

interface ThirdPartyPartner {
    name: string;
    type: 'healthcare_provider' | 'research_institution' | 'technology_partner' | 'service_provider';
    purpose: string;
    dataShared: string[];
    legalBasis: string;
    location: string;
    safeguards: string[];
}

interface DataPortabilityRequest {
    id: string;
    requestedAt: Date;
    status: 'pending' | 'processing' | 'ready' | 'completed' | 'failed';
    format: 'json' | 'csv' | 'pdf';
    estimatedCompletion?: Date;
    downloadUrl?: string;
}

const DATA_CATEGORIES: DataCategory[] = [
    {
        name: 'Medical Information',
        description: 'Health data including symptoms, treatments, and medical history',
        dataTypes: ['Symptoms', 'Treatments', 'Medications', 'Vital Signs', 'Medical Visits', 'Lab Results'],
        purpose: 'To track and manage your child\'s medical condition and provide personalized care insights',
        legalBasis: 'Consent (GDPR Article 6(1)(a)) and Health Data Processing (GDPR Article 9(2)(a))',
        retentionPeriod: '7 years after last activity or until consent withdrawal',
        icon: <Shield className="h-4 w-4" />
    },
    {
        name: 'Personal Information',
        description: 'Identity and contact information for you and your family members',
        dataTypes: ['Names', 'Email Addresses', 'Phone Numbers', 'Date of Birth', 'Profile Photos'],
        purpose: 'To provide personalized service, account management, and communication',
        legalBasis: 'Consent (GDPR Article 6(1)(a)) and Contract Performance (GDPR Article 6(1)(b))',
        retentionPeriod: '2 years after account closure',
        icon: <Users className="h-4 w-4" />
    },
    {
        name: 'Usage Data',
        description: 'Information about how you use our application and services',
        dataTypes: ['Login Times', 'Feature Usage', 'Device Information', 'IP Addresses', 'Session Data'],
        purpose: 'To improve our services, ensure security, and provide technical support',
        legalBasis: 'Legitimate Interest (GDPR Article 6(1)(f))',
        retentionPeriod: '2 years from collection',
        icon: <Database className="h-4 w-4" />
    },
    {
        name: 'Communication Data',
        description: 'Records of communications and preferences',
        dataTypes: ['Email Communications', 'Support Messages', 'Notification Preferences', 'Marketing Preferences'],
        purpose: 'To communicate with you effectively and respect your communication preferences',
        legalBasis: 'Consent (GDPR Article 6(1)(a)) and Legitimate Interest (GDPR Article 6(1)(f))',
        retentionPeriod: '3 years from last communication',
        icon: <FileText className="h-4 w-4" />
    }
];

const THIRD_PARTY_PARTNERS: ThirdPartyPartner[] = [
    {
        name: 'Firebase (Google Cloud)',
        type: 'technology_partner',
        purpose: 'Cloud hosting, authentication, and database services',
        dataShared: ['All user data (encrypted)', 'Usage analytics', 'Authentication tokens'],
        legalBasis: 'Data Processing Agreement under GDPR Article 28',
        location: 'United States (Privacy Shield certified)',
        safeguards: ['Standard Contractual Clauses', 'Encryption in transit and at rest', 'Access controls']
    },
    {
        name: 'Healthcare Research Partners',
        type: 'research_institution',
        purpose: 'Anonymized medical research to improve PANDAS/PANS treatment',
        dataShared: ['Anonymized symptom data', 'Treatment outcomes', 'Demographic information'],
        legalBasis: 'Explicit consent for research participation',
        location: 'United States and European Union',
        safeguards: ['Data anonymization', 'Research ethics approval', 'Secure data transfer']
    },
    {
        name: 'Email Service Provider',
        type: 'service_provider',
        purpose: 'Sending transactional and marketing emails',
        dataShared: ['Email addresses', 'Names', 'Communication preferences'],
        legalBasis: 'Data Processing Agreement under GDPR Article 28',
        location: 'United States',
        safeguards: ['Standard Contractual Clauses', 'Encryption', 'Access logging']
    }
];

const DataProcessingPanel: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [portabilityRequests, setPortabilityRequests] = useState<DataPortabilityRequest[]>([]);
    const [activeTab, setActiveTab] = useState('data-categories');

    // Load existing portability requests
    useEffect(() => {
        if (user?.uid) {
            loadPortabilityRequests();
        }
    }, [user?.uid]);

    const loadPortabilityRequests = async () => {
        // Mock implementation - in real app would load from database
        setPortabilityRequests([]);
    };

    // Request data portability
    const requestDataPortability = async (format: 'json' | 'csv' | 'pdf') => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            setError(null);

            const request: DataPortabilityRequest = {
                id: crypto.randomUUID(),
                requestedAt: new Date(),
                status: 'pending',
                format,
                estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            };

            // Log the portability request
            await privacyService.logPrivacyAction(user.uid, 'export_data', {
                resourceType: 'data_portability',
                resourceId: request.id,
                details: `Data portability requested in ${format} format`
            });

            setPortabilityRequests(prev => [...prev, request]);

            // In real implementation, this would trigger backend processing
            console.log(`Data portability request created: ${request.id}`);

        } catch (err) {
            console.error('Error requesting data portability:', err);
            setError(err instanceof Error ? err.message : 'Failed to request data portability');
        } finally {
            setLoading(false);
        }
    };

    const getPartnerTypeIcon = (type: ThirdPartyPartner['type']) => {
        switch (type) {
            case 'healthcare_provider':
                return <Shield className="h-4 w-4" />;
            case 'research_institution':
                return <FileText className="h-4 w-4" />;
            case 'technology_partner':
                return <Database className="h-4 w-4" />;
            case 'service_provider':
                return <Building className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getPartnerTypeBadge = (type: ThirdPartyPartner['type']) => {
        const variants = {
            healthcare_provider: 'default',
            research_institution: 'secondary',
            technology_partner: 'outline',
            service_provider: 'destructive'
        } as const;

        const labels = {
            healthcare_provider: 'Healthcare',
            research_institution: 'Research',
            technology_partner: 'Technology',
            service_provider: 'Service'
        };

        return (
            <Badge variant={variants[type]}>
                {labels[type]}
            </Badge>
        );
    };

    const getStatusIcon = (status: DataPortabilityRequest['status']) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'processing':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'ready':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-gray-500" />;
            case 'failed':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Data Processing Transparency
                    </CardTitle>
                    <CardDescription>
                        Understand how your data is collected, used, and shared. Request copies of your data or learn about our data processing practices.
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="data-categories">Data Categories</TabsTrigger>
                    <TabsTrigger value="third-parties">Third Parties</TabsTrigger>
                    <TabsTrigger value="legal-basis">Legal Basis</TabsTrigger>
                    <TabsTrigger value="portability">Data Portability</TabsTrigger>
                </TabsList>

                {/* Data Categories Tab */}
                <TabsContent value="data-categories" className="mt-6">
                    <div className="space-y-4">
                        {DATA_CATEGORIES.map((category, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {category.icon}
                                        {category.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {category.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Data Types Collected:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {category.dataTypes.map((type) => (
                                                <Badge key={type} variant="outline">
                                                    {type}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-medium mb-1">Purpose:</h4>
                                            <p className="text-sm text-muted-foreground">{category.purpose}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-1">Retention Period:</h4>
                                            <p className="text-sm text-muted-foreground">{category.retentionPeriod}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-1">Legal Basis:</h4>
                                        <p className="text-sm text-muted-foreground">{category.legalBasis}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Third Parties Tab */}
                <TabsContent value="third-parties" className="mt-6">
                    <div className="space-y-4">
                        {THIRD_PARTY_PARTNERS.map((partner, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {getPartnerTypeIcon(partner.type)}
                                            {partner.name}
                                        </div>
                                        {getPartnerTypeBadge(partner.type)}
                                    </CardTitle>
                                    <CardDescription>
                                        {partner.purpose}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Data Shared:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {partner.dataShared.map((data) => (
                                                <Badge key={data} variant="secondary">
                                                    {data}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-medium mb-1">Location:</h4>
                                            <p className="text-sm text-muted-foreground">{partner.location}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-1">Legal Basis:</h4>
                                            <p className="text-sm text-muted-foreground">{partner.legalBasis}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Safeguards:</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {partner.safeguards.map((safeguard, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                    {safeguard}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Legal Basis Tab */}
                <TabsContent value="legal-basis" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Scale className="h-5 w-5" />
                                Legal Basis for Data Processing
                            </CardTitle>
                            <CardDescription>
                                Understanding the legal foundations for how we process your data
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">Consent (GDPR Article 6(1)(a))</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        You have given clear consent for us to process your personal data for specific purposes.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Your Rights:</strong> You can withdraw consent at any time. Withdrawal does not affect the lawfulness of processing before withdrawal.
                                    </p>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">Health Data Processing (GDPR Article 9(2)(a))</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        You have given explicit consent for processing health data for medical tracking and care management.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Special Protection:</strong> Health data receives additional protection under GDPR and requires explicit consent.
                                    </p>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">Contract Performance (GDPR Article 6(1)(b))</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Processing is necessary for the performance of our service contract with you.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Examples:</strong> Account management, service delivery, billing (if applicable).
                                    </p>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h3 className="font-medium mb-2">Legitimate Interest (GDPR Article 6(1)(f))</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Processing is necessary for our legitimate interests, provided your rights don't override these interests.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Examples:</strong> Security monitoring, service improvement, fraud prevention.
                                    </p>
                                </div>
                            </div>

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Your Rights:</strong> Under GDPR, you have the right to access, rectify, erase, restrict processing,
                                    data portability, and object to processing. You also have the right to lodge a complaint with a supervisory authority.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Portability Tab */}
                <TabsContent value="portability" className="mt-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="h-5 w-5" />
                                    Data Portability
                                </CardTitle>
                                <CardDescription>
                                    Request a copy of your data in a machine-readable format. We'll provide your data within 30 days.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Button
                                        onClick={() => requestDataPortability('json')}
                                        disabled={loading}
                                        variant="outline"
                                        className="h-20 flex flex-col items-center justify-center gap-2"
                                    >
                                        <FileText className="h-6 w-6" />
                                        <span>JSON Format</span>
                                        <span className="text-xs text-muted-foreground">Machine-readable</span>
                                    </Button>

                                    <Button
                                        onClick={() => requestDataPortability('csv')}
                                        disabled={loading}
                                        variant="outline"
                                        className="h-20 flex flex-col items-center justify-center gap-2"
                                    >
                                        <Database className="h-6 w-6" />
                                        <span>CSV Format</span>
                                        <span className="text-xs text-muted-foreground">Spreadsheet-friendly</span>
                                    </Button>

                                    <Button
                                        onClick={() => requestDataPortability('pdf')}
                                        disabled={loading}
                                        variant="outline"
                                        className="h-20 flex flex-col items-center justify-center gap-2"
                                    >
                                        <FileText className="h-6 w-6" />
                                        <span>PDF Format</span>
                                        <span className="text-xs text-muted-foreground">Human-readable</span>
                                    </Button>
                                </div>

                                <Alert>
                                    <Clock className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Processing Time:</strong> Data portability requests are processed within 30 days.
                                        You'll receive an email notification when your data is ready for download.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Portability Requests History */}
                        {portabilityRequests.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Data Portability Requests</CardTitle>
                                    <CardDescription>
                                        Track the status of your data portability requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {portabilityRequests.map((request) => (
                                            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(request.status)}
                                                    <div>
                                                        <p className="font-medium">
                                                            {request.format.toUpperCase()} Export
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Requested on {request.requestedAt.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={request.status === 'ready' ? 'default' : 'secondary'}>
                                                        {request.status}
                                                    </Badge>
                                                    {request.status === 'ready' && request.downloadUrl && (
                                                        <Button size="sm" className="ml-2">
                                                            <Download className="h-4 w-4 mr-1" />
                                                            Download
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DataProcessingPanel;