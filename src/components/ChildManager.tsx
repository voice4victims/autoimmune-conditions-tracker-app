import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Crown } from 'lucide-react';
import { ChildProfile } from '@/types/pandas';
import ChildProfileForm from './ChildProfileForm';
import { useApp } from '@/contexts/AppContext';
import { useSubscription } from '@/hooks/useSubscription';
import { isRevenueCatAvailable } from '@/lib/revenuecat';

interface ChildManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSubscription?: () => void;
}

const ChildManager: React.FC<ChildManagerProps> = ({ isOpen, onClose, onNavigateToSubscription }) => {
  const { children, deleteChild, saveChildProfile } = useApp();
  const { isPro } = useSubscription();
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [deletingChild, setDeletingChild] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false);

  const atFreeLimit = isRevenueCatAvailable() && !isPro && children.length >= 1;

  const handleEdit = (child: ChildProfile) => {
    setEditingChild(child);
    setShowAddForm(true);
  };

  const handleDelete = async (childId: string) => {
    await deleteChild(childId);
    setDeletingChild(null);
  };

  const handleSave = async (profile: ChildProfile) => {
    await saveChildProfile(profile);
    setEditingChild(null);
    setShowAddForm(false);
  };

  const handleAddNew = () => {
    if (atFreeLimit) {
      setShowUpgradeMessage(true);
      return;
    }
    setEditingChild(null);
    setShowAddForm(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Children</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button onClick={handleAddNew} className="w-full">
              Add New Child
            </Button>
            
            {children.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No children added yet. Click "Add New Child" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{child.name}</h3>
                      <p className="text-sm text-gray-500">
                        Age: {child.age} | DOB: {child.dateOfBirth}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(child)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingChild(child.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddForm} onOpenChange={() => setShowAddForm(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? 'Edit Child Profile' : 'Add New Child'}
            </DialogTitle>
          </DialogHeader>
          <ChildProfileForm
            onCreateProfile={handleSave}
            existingProfile={editingChild}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingChild} onOpenChange={() => setDeletingChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this child's profile? This will permanently remove all symptom data and treatment history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingChild && handleDelete(deletingChild)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showUpgradeMessage} onOpenChange={() => setShowUpgradeMessage(false)}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-sans font-bold text-lg text-neutral-800 dark:text-neutral-100">
              Upgrade to Pro or Family
            </h3>
            <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              Free plan allows 1 child profile. Upgrade to Pro or Family for unlimited profiles.
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowUpgradeMessage(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowUpgradeMessage(false);
                  onClose();
                  onNavigateToSubscription?.();
                }}
              >
                Upgrade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChildManager;