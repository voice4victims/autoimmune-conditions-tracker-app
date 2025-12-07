import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Users } from 'lucide-react';

export const FamilyAcceptInvite: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    setLoading(true);
    try {
      // Find the invitation
      const { data: invitation, error: findError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('invitation_code', inviteCode.trim())
        .eq('status', 'pending')
        .single();

      if (findError || !invitation) {
        throw new Error('Invalid or expired invitation code');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user to family access
      const { error: accessError } = await supabase
        .from('family_access')
        .insert({
          family_id: invitation.family_id,
          user_id: user.id,
          role: 'parent',
          invited_by: invitation.invited_by,
          accepted_at: new Date().toISOString()
        });

      if (accessError) throw accessError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('family_invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success!',
        description: 'You now have access to the family data.',
      });

      setInviteCode('');
      // Refresh the page to update access
      window.location.reload();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-1 md:mx-0">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Users className="h-4 w-4 md:h-5 md:w-5" />
          Join Family
        </CardTitle>
        <CardDescription className="text-sm">
          Enter the invitation code to access family data.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleAcceptInvite} className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode" className="text-sm font-medium">Invitation Code</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invitation code"
              className="text-sm"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-10 text-sm">
            <Check className="h-4 w-4 mr-2" />
            {loading ? 'Joining...' : 'Join Family'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};