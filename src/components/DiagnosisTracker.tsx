import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface Diagnosis {
  id: string;
  name: string;
}

export const DiagnosisTracker = () => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const addDiagnosis = () => {
    if (newDiagnosis.trim() !== "") {
      setDiagnoses([...diagnoses, { id: Date.now().toString(), name: newDiagnosis.trim() }]);
      setNewDiagnosis("");
    }
  };

  const removeDiagnosis = (id: string) => {
    setDiagnoses(diagnoses.filter((d) => d.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnosis Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newDiagnosis}
              onChange={(e) => setNewDiagnosis(e.target.value)}
              placeholder="Add a new diagnosis"
            />
            <Button onClick={addDiagnosis}>Add</Button>
          </div>
          <ul className="space-y-2">
            {diagnoses.map((diagnosis) => (
              <li key={diagnosis.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                <span>{diagnosis.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeDiagnosis(diagnosis.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
