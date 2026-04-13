import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/useRoleAccess';
import { useSubscription } from '@/hooks/useSubscription';
import { isRevenueCatAvailable, TIER_LIMITS } from '@/lib/revenuecat';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { RoleSelector } from '@/components/RoleSelector';
import { UserRole } from '@/types/roles';
import { Mail, UserPlus, Crown, Sparkles } from 'lucide-react';

const UpgradeToFamilyPrompt: React.FC<{
  packages: PurchasesPackage[];
  onPurchase: (pkg: PurchasesPackage) => Promise<boolean>;
}> = ({ packages, onPurchase }) => {
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    await onPurchase(pkg);
    setPurchasing(false);
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">Upgrade to Family</h3>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Unlimited caregivers
        </li>
        <li className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Named role assignment
        </li>
        <li className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          10 GB storage
        </li>
      </ul>
      <div className="space-y-2">
        {packages.map((pkg) => (
          <Button
            key={pkg.identifier}
            onClick={() => handlePurchase(pkg)}
            disabled={purchasing}
            className="w-full h-9 text-sm"
            size="sm"
          >
            {pkg.product.title} — {pkg.product.priceString}
          </Button>
        ))}
      </div>
    </div>
  );
};

export const FamilyInviteForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('viewer');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [countLoading, setCountLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canInviteUsers } = usePermissions();
  const { tier, offerings, purchasePackage } = useSubscription();

  const isNativeApp = isRevenueCatAvailable();
  const tierLimits = TIER_LIMITS[tier];
  const atLimit = isNativeApp && activeCount >= tierLimits.maxCaregivers;
  const upgradeOffering = offerings?.all?.['upgrade_to_family'] ?? null;

  useEffect(() => {
    if (user && open) {
      loadActiveCount();
    }
  }, [user, open]);

  useEffect(() => {
    if (isNativeApp && selectedRole && !(tierLimits.allowedRoles as readonly string[]).includes(selectedRole)) {
      setSelectedRole(tierLimits.allowedRoles[0] as UserRole);
    }
  }, [tier, isNativeApp]);

  const loadActiveCount = async () => {
    if (!user) return;
    setCountLoading(true);
    try {
      const accessRef = collection(db, 'family_access');
      const q = query(
        accessRef,
        where('family_id', '==', user.uid),
        where('is_active', '==', true)
      );
      const snapshot = await getDocs(q);
      setActiveCount(snapshot.size);
    } catch {
      setActiveCount(0);
    } finally {
      setCountLoading(false);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim() || !selectedRole) return;

    if (isNativeApp && activeCount >= tierLimits.maxCaregivers) return;

    setLoading(true);
    try {
      const inviteCode = generateInviteCode();
      const familyId = user.uid;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

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
      setSelectedRole(tierLimits.allowedRoles[0] as UserRole);
      setActiveCount(prev => prev + 1);
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

  const limitMessage = tier === 'free'
    ? 'Free plan allows 1 caregiver. Upgrade to Pro for up to 3.'
    : 'Pro plan allows 3 caregivers. Upgrade to Family for unlimited.';

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
            {atLimit && !countLoading ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">{limitMessage}</p>
                </div>
                {tier === 'pro' && upgradeOffering && (
                  <UpgradeToFamilyPrompt
                    packages={upgradeOffering.availablePackages}
                    onPurchase={purchasePackage}
                  />
                )}
              </div>
            ) : (
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
                  allowedRoles={isNativeApp ? (tierLimits.allowedRoles as unknown as UserRole[]) : undefined}
                />

                <Button
                  type="submit"
                  disabled={loading || !selectedRole || !canInviteUsers || countLoading}
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
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
