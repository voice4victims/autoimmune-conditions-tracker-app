
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { EmailAuthProvider, GoogleAuthProvider, OAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';

const USER_ID_FIELD_COLLECTIONS = [
  'symptom_ratings',
  'symptoms',
  'vital_signs',
  'food_diary',
  'activity_logs',
  'file_uploads',
  'healthcare_providers',
  'medical_visits',
  'medication_reminders',
  'supplement_recipes',
  'recipes',
  'allergy_records',
  'medical_records',
  'trigger_events',
  'notes',
  'treatments',
];

const USERID_FIELD_COLLECTIONS = [
  'children',
  'family_access',
  'family_invitations',
  'user_sessions',
  'session_security_events',
  'push_tokens',
  'deletion_requests',
  'deletion_confirmations',
  'provider_access',
  'temporary_access',
  'access_reviews',
  'breach_notifications',
  'risk_assessments',
  'audit_failures',
  'magic_links',
  'magic_link_access',
];

async function deleteCollectionDocs(collectionName: string, fieldName: string, userId: string) {
  const q = query(collection(db, collectionName), where(fieldName, '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 0;

  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return snapshot.size;
}

async function deleteDocById(collectionName: string, docId: string) {
  const ref = doc(db, collectionName, docId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return 1;
  }
  return 0;
}

const DataDeletion: React.FC = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [step, setStep] = useState<'reauth' | 'confirm'>('reauth');
  const [password, setPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthenticating, setReauthenticating] = useState(false);

  const providerId = user?.providerData?.[0]?.providerId;

  const handleReauth = async () => {
    if (!auth.currentUser) return;
    setReauthenticating(true);
    setReauthError(null);
    try {
      if (providerId === 'google.com') {
        await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
      } else if (providerId === 'apple.com') {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        await reauthenticateWithPopup(auth.currentUser, provider);
      } else {
        if (!password) { setReauthError('Password is required'); setReauthenticating(false); return; }
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      setStep('confirm');
    } catch (err: any) {
      setReauthError(err?.message?.includes('wrong-password') ? 'Incorrect password' : 'Re-authentication failed. Please try again.');
    } finally {
      setReauthenticating(false);
    }
  };

  const resetDialog = (open: boolean) => {
    if (deleting) return;
    setIsOpen(open);
    if (!open) { setStep('reauth'); setPassword(''); setReauthError(null); }
  };

  const handleDelete = async () => {
    if (!user?.uid) return;
    setDeleting(true);

    try {
      let totalDeleted = 0;

      for (const col of USER_ID_FIELD_COLLECTIONS) {
        totalDeleted += await deleteCollectionDocs(col, 'user_id', user.uid);
      }

      for (const col of USERID_FIELD_COLLECTIONS) {
        totalDeleted += await deleteCollectionDocs(col, 'userId', user.uid);
      }

      const childrenQuery = query(collection(db, 'children'), where('userId', '==', user.uid));
      const childrenSnap = await getDocs(childrenQuery);
      const childSubcollections = ['symptoms', 'treatments', 'notes', 'vital_signs', 'food_diary'];
      for (const childDoc of childrenSnap.docs) {
        for (const sub of childSubcollections) {
          const subSnap = await getDocs(collection(db, 'children', childDoc.id, sub));
          if (!subSnap.empty) {
            const batch = writeBatch(db);
            subSnap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            totalDeleted += subSnap.size;
          }
        }
      }

      totalDeleted += await deleteDocById('privacy_settings', user.uid);
      totalDeleted += await deleteDocById('users', user.uid);

      const patientQuery = query(collection(db, 'patient_profiles'));
      const patientSnap = await getDocs(patientQuery);
      for (const d of patientSnap.docs) {
        if (d.id.startsWith(`${user.uid}_`)) {
          await deleteDoc(d.ref);
          totalDeleted++;
        }
      }

      const insuranceQuery = query(collection(db, 'insurance_info'));
      const insuranceSnap = await getDocs(insuranceQuery);
      for (const d of insuranceSnap.docs) {
        if (d.id.startsWith(`${user.uid}_`)) {
          await deleteDoc(d.ref);
          totalDeleted++;
        }
      }

      setIsOpen(false);
      toast({
        title: "Account Deleted",
        description: `${totalDeleted} records permanently removed. You will be signed out.`,
      });

      setTimeout(() => signOut(), 2000);
    } catch (error) {
      console.error('Data deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: "Some data could not be deleted. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Data Deletion</h3>
      <p className="text-sm text-gray-600 mb-4">
        You have the right to request the permanent deletion of your account and all associated data. This action is irreversible.
      </p>
      <Dialog open={isOpen} onOpenChange={resetDialog}>
        <DialogTrigger asChild>
          <Button variant="destructive">Request Data Deletion</Button>
        </DialogTrigger>
        <DialogContent>
          {step === 'reauth' ? (
            <>
              <DialogHeader>
                <DialogTitle>Verify your identity</DialogTitle>
                <DialogDescription>
                  For security, please re-authenticate before deleting your account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {providerId === 'google.com' ? (
                  <Button onClick={handleReauth} disabled={reauthenticating} className="w-full">
                    {reauthenticating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Re-authenticate with Google
                  </Button>
                ) : providerId === 'apple.com' ? (
                  <Button onClick={handleReauth} disabled={reauthenticating} className="w-full">
                    {reauthenticating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Re-authenticate with Apple
                  </Button>
                ) : (
                  <>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReauth()}
                    />
                    <Button onClick={handleReauth} disabled={reauthenticating} className="w-full">
                      {reauthenticating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Verify Password
                    </Button>
                  </>
                )}
                {reauthError && <p className="text-sm text-red-600">{reauthError}</p>}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and all associated health data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary" onClick={() => resetDialog(false)} disabled={deleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {deleting ? 'Deleting...' : 'I understand, delete my data'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataDeletion;
