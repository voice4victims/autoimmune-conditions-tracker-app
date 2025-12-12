import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/useRoleAccess';
import { RoleSelector } from '@/components/RoleSelector';
import { UserRole } from '@/types/roles';
import { Mail, UserPlus } from 'lucide-react';

export const FamilyInviteForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('parent');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canInviteUsers } = usePermissions();

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim() || !selectedRole) return;

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      const familyId = user.uid;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      await addDoc(collection(db, 'family_invitations'), {
        family_id: familyId,
        email: email.trim().toLowerCase(),
        invited_by: user.uid,
        invitation_code: inviteCode,
        role: selectedRole,
        status: 'pending',
        expires_at: expiresAt,
        created_at: new Date()
      });

      toast({
        title: 'Invitation sent!',
        description: `Invitation sent to ${email} with ${selectedRole} role. Code: ${inviteCode}`,
      });

      setEmail('');
      setSelectedRole('parent');
      setOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Another Parent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Another Parent</DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-3">
            <CardDescription className="text-sm">
              Share access to your child's data with another parent or caregiver.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter parent's email address"
                  className="text-sm"
                  required
                />
              </div>

              <RoleSelector
                value={selectedRole}
                onValueChange={setSelectedRole}
                showDescription={true}
              />

              <Button
                type="submit"
                disabled={loading || !selectedRole || !canInviteUsers}
                className="w-full h-10 text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>

              {!canInviteUsers && (
                <p className="text-xs text-muted-foreground text-center">
                  You don't have permission to invite users
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};