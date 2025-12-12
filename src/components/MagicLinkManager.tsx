import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/useRoleAccess';
import { magicLinkService } from '@/lib/firebaseService';
import { MagicLink } from '@/types/magicLink';
import { Link2, Eye, Clock, Users, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export const MagicLinkManager: React.FC = () => {
    const { user } = useAuth();
    const { canManageUsers } = usePermissions();
    const [magicLinks, setMagicLinks] = useState<MagicLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMagicLinks();
        }
    }, [user]);

    const fetchMagicLinks = async () => {
        try {
            const links = await magicLinkService.getFamilyMagicLinks(user?.uid || '');
            setMagicLinks(links as MagicLink[]);
        } catch (error) {
            console.error('Error fetching magic links:', error);
            toast.error('Failed to load provider access links');
        } finally {
            setLoading(false);
        }
    };

    const deactivateLink = async (linkId: string, providerName: string) => {
        try {
            await magicLinkService.deactivateMagicLink(linkId);
            setMagicLinks(prev => prev.map(link =>
                link.id === linkId ? { ...link, is_active: false } : link
            ));
            toast.success(`Access revoked for ${providerName}`);
        } catch (error) {
            console.error('Error deactivating magic link:', error);
            toast.error('Failed to revoke access');
        }
    };

    const getStatusBadge = (link: MagicLink) => {
        const now = new Date();
        const expiresAt = new Date(link.expires_at);

        if (!link.is_active) {
            return <Badge variant="destructive">Deactivated</Badge>;
        }

        if (expiresAt < now) {
            return <Badge variant="destructive">Expired</Badge>;
        }

        if (link.max_access_count && link.access_count >= link.max_access_count) {
            return <Badge variant="destructive">Access Limit Reached</Badge>;
        }

        return <Badge variant="default" className="bg-green-600">Active</Badge>;
    };

    const isLinkActive = (link: MagicLink) => {
        const now = new Date();
        const expiresAt = new Date(link.expires_at);

        return link.is_active &&
            expiresAt > now &&
            (!link.max_access_count || link.access_count < link.max_access_count);
    };

    if (loading) {
        return <div className="text-center py-4">Loading provider access links...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Provider Access Links
                </CardTitle>
            </CardHeader>
            <CardContent>
                {magicLinks.length === 0 ? (
                    <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No provider access links created yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {magicLinks.map((link) => (
                            <div key={link.id} className="border rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold">{link.provider_name}</h4>
                                            {getStatusBadge(link)}
                                        </div>

                                        {link.provider_email && (
                                            <p className="text-sm text-muted-foreground mb-2">{link.provider_email}</p>
                                        )}

                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Created: {format(new Date(link.created_at), 'MMM d, yyyy')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Expires: {format(new Date(link.expires_at), 'MMM d, yyyy HH:mm')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                Accessed: {link.access_count} times
                                                {link.max_access_count && ` (max: ${link.max_access_count})`}
                                            </span>
                                        </div>

                                        <div className="mt-2">
                                            <div className="flex flex-wrap gap-1">
                                                {link.permissions.map((permission) => (
                                                    <Badge key={permission} variant="outline" className="text-xs">
                                                        {permission.replace('_', ' ')}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {link.notes && (
                                            <p className="text-sm text-muted-foreground mt-2 italic">
                                                "{link.notes}"
                                            </p>
                                        )}

                                        {link.last_accessed && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Last accessed: {format(new Date(link.last_accessed), 'MMM d, yyyy HH:mm')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isLinkActive(link) ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        )}

                                        {canManageUsers && isLinkActive(link) && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Revoke Provider Access</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to revoke access for {link.provider_name}?
                                                            This will immediately deactivate their link and they will no longer
                                                            be able to access your child's data.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => deactivateLink(link.id, link.provider_name)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Revoke Access
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};