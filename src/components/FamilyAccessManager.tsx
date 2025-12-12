import React, { useState, useEffect } from 'react';
import { familyService, roleService } from '@/lib/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/useRoleAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleBadge, RoleSelector } from '@/components/RoleSelector';
import { UserRole } from '@/types/roles';
import { Trash2, UserX, Edit2, Save, X } from 'lucide-react';
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
  role: UserRole;
  granted_at: string;
  user_id: string;
  is_active: boolean;
}

export const FamilyAccessManager: React.FC = () => {
  const { user } = useAuth();
  const { canManageUsers } = usePermissions();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | ''>('');

  useEffect(() => {
    if (user) {
      fetchFamilyMembers();
    }
  }, [user]);

  const fetchFamilyMembers = async () => {
    try {
      const members = await roleService.getFamilyMembersWithRoles(user?.uid || '');
      setFamilyMembers(members as FamilyMember[]);
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast.error('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (memberId: string, email: string) => {
    try {
      await roleService.deactivateUserAccess(memberId);
      setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
      toast.success(`Access revoked for ${email}`);
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  const handleEditRole = (member: FamilyMember) => {
    setEditingMember(member.id);
    setEditingRole(member.role);
  };

  const handleSaveRole = async (memberId: string, email: string) => {
    if (!editingRole) return;

    try {
      await roleService.updateUserRole(memberId, editingRole);
      setFamilyMembers(prev =>
        prev.map(member =>
          member.id === memberId
            ? { ...member, role: editingRole as UserRole }
            : member
        )
      );
      toast.success(`Role updated for ${email}`);
      setEditingMember(null);
      setEditingRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditingRole('');
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
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-2">
                      <div className="min-w-[120px]">
                        <RoleSelector
                          value={editingRole}
                          onValueChange={setEditingRole}
                          showDescription={false}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveRole(member.id, member.email)}
                        disabled={!editingRole}
                        className="h-8 w-8 p-0"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <RoleBadge role={member.role} size="sm" />
                      {canManageUsers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(member)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      {canManageUsers && (
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
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!canManageUsers && familyMembers.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              You don't have permission to manage user roles or access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};