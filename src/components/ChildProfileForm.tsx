import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChildProfile } from '@/types/pandas';
import { useToast } from '@/hooks/use-toast';
import PhotoUpload from './PhotoUpload';

interface ChildProfileFormProps {
  onCreateProfile?: (profile: ChildProfile) => Promise<void>;
  onChildAdded?: () => void;
  existingProfile?: ChildProfile | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ChildProfileForm: React.FC<ChildProfileFormProps> = ({ 
  onCreateProfile, 
  onChildAdded, 
  existingProfile,
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [diagnosisDate, setDiagnosisDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setName(existingProfile.name);
      setDateOfBirth(existingProfile.dateOfBirth || '');
      setAge(existingProfile.age || '');
      setDiagnosisDate(existingProfile.diagnosisDate || '');
      setNotes(existingProfile.notes || '');
      setPhotoUrl(existingProfile.photoUrl || null);
    }
  }, [existingProfile]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const handleDateOfBirthChange = (date: string) => {
    setDateOfBirth(date);
    const calculatedAge = calculateAge(date);
    if (calculatedAge !== '') {
      setAge(calculatedAge);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const profile: ChildProfile = {
        id: existingProfile?.id,
        name: name.trim(),
        dateOfBirth: dateOfBirth || undefined,
        age: age || undefined,
        diagnosisDate: diagnosisDate || undefined,
        notes: notes.trim() || undefined,
        photoUrl: photoUrl || undefined,
        symptoms: existingProfile?.symptoms || []
      };
      
      if (onCreateProfile) {
        await onCreateProfile(profile);
      }
      
      if (onChildAdded) {
        onChildAdded();
      }
      
      if (!existingProfile) {
        setName('');
        setDateOfBirth('');
        setAge('');
        setDiagnosisDate('');
        setNotes('');
        setPhotoUrl(null);
      }
      
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      toast({ title: 'Success', description: 'Profile saved successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhotoUpload 
        currentPhotoUrl={photoUrl || undefined}
        onPhotoChange={setPhotoUrl}
        childName={name}
      />
      
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Child's Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter child's name"
          required
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob" className="text-sm font-medium">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => handleDateOfBirthChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium">Age</Label>
          <Input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="Age"
            min="0"
            max="18"
            className="w-full"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="diagnosis" className="text-sm font-medium">PANDAS Diagnosis Date (Optional)</Label>
        <Input
          id="diagnosis"
          type="date"
          value={diagnosisDate}
          onChange={(e) => setDiagnosisDate(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about your child's condition, triggers, medications, etc."
          rows={3}
          className="w-full resize-none"
        />
      </div>
      
      <Button type="submit" disabled={loading} className="w-full mt-6 py-2 text-base">
        {loading ? 'Saving...' : (existingProfile ? 'Update Profile' : 'Create Profile')}
      </Button>
    </form>
  );

  if (open !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingProfile ? 'Edit Child Profile' : 'Create Child Profile'}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">
          {existingProfile ? 'Edit Child Profile' : 'Create Child Profile'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
};

export default ChildProfileForm;