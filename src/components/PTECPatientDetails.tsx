import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PTECPatientDetailsProps {
  data: any;
  onChange: (data: any) => void;
}

const PTECPatientDetails: React.FC<PTECPatientDetailsProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={data.dob || ''}
            onChange={(e) => onChange({ ...data, dob: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="age">Age (years)</Label>
          <Input
            id="age"
            type="number"
            value={data.age || ''}
            onChange={(e) => onChange({ ...data, age: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="evaluationDate">Date of Evaluation</Label>
        <Input
          id="evaluationDate"
          type="date"
          value={data.evaluationDate || new Date().toISOString().split('T')[0]}
          onChange={(e) => onChange({ ...data, evaluationDate: e.target.value })}
        />
      </div>

      <div>
        <Label>Biological Sex</Label>
        <RadioGroup value={data.sex || ''} onValueChange={(v) => onChange({ ...data, sex: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female">Female</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male">Male</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>Symptom Status</Label>
        <RadioGroup value={data.flareStatus || ''} onValueChange={(v) => onChange({ ...data, flareStatus: v })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ongoing" id="ongoing" />
            <Label htmlFor="ongoing">Currently experiencing an ongoing flare</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="new" />
            <Label htmlFor="new">Currently experiencing a new flare</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none">Not currently experiencing a flare</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default PTECPatientDetails;
