import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MultiSymptomSelectorProps {
  availableSymptoms: string[];
  selectedSymptoms: string[];
  onSymptomToggle: (symptom: string) => void;
  symptomCounts?: Record<string, number>;
}

const MultiSymptomSelector: React.FC<MultiSymptomSelectorProps> = ({
  availableSymptoms,
  selectedSymptoms,
  onSymptomToggle,
  symptomCounts = {}
}) => {
  const handleSelectAll = () => {
    if (selectedSymptoms.length === availableSymptoms.length) {
      // Deselect all
      selectedSymptoms.forEach(symptom => onSymptomToggle(symptom));
    } else {
      // Select all
      availableSymptoms.forEach(symptom => {
        if (!selectedSymptoms.includes(symptom)) {
          onSymptomToggle(symptom);
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Symptoms to Analyze</span>
          <Badge variant="outline">
            {selectedSymptoms.length} of {availableSymptoms.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedSymptoms.length === availableSymptoms.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All
            </Label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableSymptoms.map(symptom => (
              <div key={symptom} className="flex items-center space-x-2">
                <Checkbox
                  id={symptom}
                  checked={selectedSymptoms.includes(symptom)}
                  onCheckedChange={() => onSymptomToggle(symptom)}
                />
                <Label htmlFor={symptom} className="flex-1 cursor-pointer">
                  {symptom}
                  {symptomCounts[symptom] && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({symptomCounts[symptom]})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiSymptomSelector;