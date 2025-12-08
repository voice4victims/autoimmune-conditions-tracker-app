import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, RefreshCw, Key } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  invitation_code: string;
  status: string;
  created_at: string;
}

export const InviteCodeRetrieval: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      const invitationsRef = collection(firestore, 'family_invitations');
      const q = query(invitationsRef, where('invited_by', '==', user.uid), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const invitationsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvitations(invitationsData as Invitation[]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Invitation code copied to clipboard.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="mx-1 md:mx-0">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-1 md:mx-0">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Key className="h-4 w-4 md:h-5 md:w-5" />
          Invitation Codes
        </CardTitle>
        <CardDescription className="text-sm">
          View and manage your sent invitations and their codes.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            No invitations sent yet.
          </p>
        ) : (
          <div className="space-y-2 md:space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm truncate">{invitation.email}</span>
                    <Badge className={`${getStatusColor(invitation.status)} text-xs`}>
                      {invitation.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">
                    Code: <span className="font-mono">{invitation.invitation_code}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent: {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(invitation.invitation_code)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" onClick={fetchInvitations} className="w-full h-10 text-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};