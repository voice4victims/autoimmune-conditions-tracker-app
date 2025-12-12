import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/useRoleAccess';
import { magicLinkService } from '@/lib/firebaseService';
import { MagicLinkConfig, MagicLinkPermission, MAGIC_LINK_PERMISSIONS } from '@/types/magicLink';
import { Link2, Copy, Clock, Shield, Eye, FileText } from 'lucide-react';

export const MagicLinkGenerator: React.FC = () => {
    const { user } = useAuth();
    const { childProfile } = useApp();
    const { canInviteUsers } = usePermissions();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [config, setConfig] = useState<MagicLinkConfig>({
        provider_name: '',
        provider_email: '',
        permissions: [],
        expires_in_hours: 24,
        max_access_count: 5,
        notes: ''
    });

    const handlePermissionChange = (permission: MagicLinkPermission, checked: boolean) => {
        setConfig(prev => ({
            ...prev,
            permissions: checked
                ? [...prev.permissions, permission]
                : prev.permissions.filter(p => p !== permission)
        }));
    };

    const generateMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !childProfile || !config.provider_name.trim()) return;

        setLoading(true);
        try {
            const result = await magicLinkService.createMagicLink(config, user.uid, childProfile.id);

            const baseUrl = window.location.origin;
            const magicUrl = `${baseUrl}/provider-access/${result.access_token}`;
            setGeneratedLink(magicUrl);

            toast({
                title: 'Magic Link Generated!',
                description: `Secure link created for ${config.provider_name}`,
            });

            // Reset form
            setConfig({
                provider_name: '',
                provider_email: '',
                permissions: [],
                expires_in_hours: 24,
                max_access_count: 5,
                notes: ''
            });
        } catch (error) {
            console.error('Error generating magic link:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate magic link. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!generatedLink) return;

        try {
            await navigator.clipboard.writeText(generatedLink);
            toast({
                title: 'Copied!',
                description: 'Magic link copied to clipboard',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to copy link',
                variant: 'destructive',
            });
        }
    };

    if (!canInviteUsers) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <Shield className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                        Access Restricted
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                        You don't have permission to generate provider access links.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="w-5 h-5" />
                        Generate Provider Access Link
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={generateMagicLink} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="providerName">Provider Name *</Label>
                                <Input
                                    id="providerName"
                                    value={config.provider_name}
                                    onChange={(e) => setConfig(prev => ({ ...prev, provider_name: e.target.value }))}
                                    placeholder="Dr. Smith, Children's Hospital"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="providerEmail">Provider Email (Optional)</Label>
                                <Input
                                    id="providerEmail"
                                    type="email"
                                    value={config.provider_email}
                                    onChange={(e) => setConfig(prev => ({ ...prev, provider_email: e.target.value }))}
                                    placeholder="doctor@hospital.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Data Access Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(MAGIC_LINK_PERMISSIONS).map(([key, description]) => (
                                    <div key={key} className="flex items-start space-x-2 p-3 border rounded-lg">
                                        <Checkbox
                                            id={key}
                                            checked={config.permissions.includes(key as MagicLinkPermission)}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(key as MagicLinkPermission, checked as boolean)
                                            }
                                        />
                                        <div className="flex-1">
                                            <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                                                {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Label>
                                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiresIn">Expires In (Hours)</Label>
                                <Select
                                    value={config.expires_in_hours.toString()}
                                    onValueChange={(value) => setConfig(prev => ({ ...prev, expires_in_hours: parseInt(value) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Hour</SelectItem>
                                        <SelectItem value="6">6 Hours</SelectItem>
                                        <SelectItem value="24">24 Hours (1 Day)</SelectItem>
                                        <SelectItem value="72">72 Hours (3 Days)</SelectItem>
                                        <SelectItem value="168">1 Week</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxAccess">Max Access Count</Label>
                                <Select
                                    value={config.max_access_count?.toString() || 'unlimited'}
                                    onValueChange={(value) => setConfig(prev => ({
                                        ...prev,
                                        max_access_count: value === 'unlimited' ? undefined : parseInt(value)
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Access</SelectItem>
                                        <SelectItem value="3">3 Accesses</SelectItem>
                                        <SelectItem value="5">5 Accesses</SelectItem>
                                        <SelectItem value="10">10 Accesses</SelectItem>
                                        <SelectItem value="unlimited">Unlimited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={config.notes}
                                onChange={(e) => setConfig(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Purpose of access, appointment details, etc."
                                rows={3}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !config.provider_name.trim() || config.permissions.length === 0}
                            className="w-full"
                        >
                            {loading ? 'Generating...' : 'Generate Secure Link'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {generatedLink && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <Eye className="w-5 h-5" />
                            Magic Link Generated
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-white border rounded-lg">
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-sm break-all flex-1">{generatedLink}</code>
                                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Expires in {config.expires_in_hours}h
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {config.permissions.length} permissions
                            </Badge>
                        </div>

                        <div className="text-sm text-green-700">
                            <p className="font-medium">Share this link securely with {config.provider_name}</p>
                            <p className="text-xs mt-1">
                                This link provides temporary access to your child's medical data.
                                It will expire automatically and can be deactivated at any time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};