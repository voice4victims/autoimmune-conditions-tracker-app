
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const DataDeletion: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    // In a real application, this would trigger a backend process
    // to permanently delete all user data.
    console.log(`Initiating data deletion for user: ${user?.uid}`);
    
    // Close the dialog and show a confirmation toast
    setIsOpen(false);
    toast({
      title: "Deletion Request Received",
      description: "Your data will be permanently deleted within 24 hours.",
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Data Deletion</h3>
      <p className="text-sm text-gray-600 mb-4">
        You have the right to request the permanent deletion of your account and all associated data. This action is irreversible.
      </p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Request Data Deletion</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated health data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>I understand, delete my data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataDeletion;
