import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CustomSymptomInputProps {
  onAddCustomSymptom: (symptom: string) => void;
}

const CustomSymptomInput: React.FC<CustomSymptomInputProps> = ({ onAddCustomSymptom }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim()) {
      onAddCustomSymptom(customSymptom.trim());
      setCustomSymptom('');
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Symptom
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Symptom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-symptom">Symptom Name</Label>
            <Input
              id="custom-symptom"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              placeholder="Enter custom symptom..."
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add Symptom
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSymptomInput;