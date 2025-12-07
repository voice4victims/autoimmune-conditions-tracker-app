import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserX } from 'lucide-react';
import { toast } from 'sonner';
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

interface FamilyMember {
  id: string;
  email: string;
  role: string;
  granted_at: string;
  user_id: string;
}

export const FamilyAccessManager: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
    }
  }, [user]);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_access')
        .select(`
          id,
          granted_user_id,
          role,
          granted_at,
          user_profiles!family_access_granted_user_id_fkey(email)
        `)
        .eq('owner_user_id', user?.id);

      if (error) throw error;

      const members = data?.map(member => ({
        id: member.id,
        email: member.user_profiles?.email || 'Unknown',
        role: member.role,
        granted_at: member.granted_at,
        user_id: member.granted_user_id
      })) || [];

      setFamilyMembers(members);
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (memberId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('family_access')
        .delete()
        .eq('id', memberId)
        .eq('owner_user_id', user?.id);

      if (error) throw error;

      setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success(`Access revoked for ${email}`);
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-sm">Loading family members...</div>;
  }

  return (
    <Card className="mx-1 md:mx-0">
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <UserX className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Family Access Management</span>
          <span className="sm:hidden">Manage Access</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {familyMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-sm">
            No family members have access yet.
          </p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{member.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Access granted: {new Date(member.granted_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="mx-4 max-w-sm sm:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base">Revoke Access</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Are you sure you want to revoke access for {member.email}? 
                          They will no longer be able to view or manage your child's data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeAccess(member.id, member.email)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                          Revoke Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};