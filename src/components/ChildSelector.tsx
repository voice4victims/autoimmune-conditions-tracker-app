import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ChildProfile } from '@/types/pandas';

interface ChildSelectorProps {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  onChildSelect: (childId: string) => void;
  onAddChild: () => void;
}

const ChildSelector: React.FC<ChildSelectorProps> = ({
  children,
  selectedChild,
  onChildSelect,
  onAddChild
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
      <div className="flex-1 max-w-xs">
        <Select value={selectedChild?.id || ''} onValueChange={onChildSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={child.id} value={child.id}>
                {child.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button 
        onClick={onAddChild} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Child
      </Button>
    </div>
  );
};

export default ChildSelector;