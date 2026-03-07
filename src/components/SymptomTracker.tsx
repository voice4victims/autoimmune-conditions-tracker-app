import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SYMPTOM_TYPES, SymptomRating } from '@/types/pandas';
import { toast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/useRoleAccess';
import { ConditionalRender } from '@/components/PermissionGuard';
import PrivacyStatusIndicator from '@/components/PrivacyStatusIndicator';
import LabResultsOCR from './LabResultsOCR';
import { cn } from '@/lib/utils';

interface SymptomTrackerProps {
  onAddSymptom: (symptom: SymptomRating) => void;
  customSymptoms?: string[];
  onAddCustomSymptom?: (symptom: string) => void;
}

const sevColor = (v: number) =>
  v <= 2 ? '#28BC79' : v <= 4 ? '#8BC34A' : v <= 6 ? '#F5A81A' : v <= 8 ? '#FF6B35' : '#E82020';

const sevLabel = (v: number) =>
  v <= 1 ? 'Minimal' : v <= 3 ? 'Mild' : v <= 5 ? 'Moderate' : v <= 7 ? 'Concerning' : v <= 9 ? 'Severe' : 'Crisis';

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

const SymptomTracker: React.FC<SymptomTrackerProps> = ({
  onAddSymptom,
  customSymptoms = [],
  onAddCustomSymptom
}) => {
  const { canWrite } = usePermissions();
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [severity, setSeverity] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isImportant, setIsImportant] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [saved, setSaved] = useState(false);

  const allSymptoms = [...SYMPTOM_TYPES, ...customSymptoms];

  const handleSubmit = () => {
    if (!selectedSymptom || severity === null) {
      toast({ title: 'Error', description: 'Please fill in all required fields' });
      return;
    }

    const symptom: SymptomRating = {
      id: Date.now().toString(),
      symptomType: selectedSymptom,
      severity,
      date,
      notes,
      isImportant
    };

    onAddSymptom(symptom);
    setSelectedSymptom('');
    setSeverity(null);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsImportant(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleOCRData = (data: any) => {
    if (data.symptom_name) setSelectedSymptom(data.symptom_name);
    if (data.severity) setSeverity(parseInt(data.severity));
    if (data.notes) setNotes(data.notes);
  };

  const handleAddCustom = () => {
    if (customValue.trim() && onAddCustomSymptom) {
      onAddCustomSymptom(customValue.trim());
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-neutral-800 m-0">Record Symptom</h3>
          <PrivacyStatusIndicator variant="icon" size="sm" />
        </div>

        <FieldWrap label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldWrap>

        <FieldWrap label="Symptom Type">
          <Select value={selectedSymptom} onValueChange={setSelectedSymptom}>
            <SelectTrigger><SelectValue placeholder="Select symptom..." /></SelectTrigger>
            <SelectContent>
              {allSymptoms.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {onAddCustomSymptom && (
            <>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-neutral-200 font-sans font-bold text-[11px] text-neutral-400 cursor-pointer bg-transparent"
              >
                + Add Custom Symptom
              </button>
              {showCustomInput && (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Custom symptom name..."
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddCustom}>Add</Button>
                </div>
              )}
            </>
          )}
        </FieldWrap>

        <FieldWrap label="Severity (0-10)">
          <div className="grid grid-cols-6 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSeverity(num)}
                className={cn(
                  'h-9 rounded-lg border-[1.5px] font-mono font-bold text-[13px] cursor-pointer transition-all',
                  severity === num
                    ? 'text-white border-transparent'
                    : 'border-neutral-200 text-neutral-400 bg-transparent'
                )}
                style={severity === num ? { background: sevColor(num) } : undefined}
              >
                {num}
              </button>
            ))}
          </div>
          {severity !== null && (
            <p className="font-sans text-[12px] text-neutral-500 mt-1.5 text-center">
              <span className="font-bold" style={{ color: sevColor(severity) }}>{severity}/10</span>
              {' — '}{sevLabel(severity)}
            </p>
          )}
        </FieldWrap>

        <div>
          <button
            onClick={() => setIsImportant((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer transition-all',
              isImportant ? 'border-warning-400 bg-warning-50 text-warning-500' : 'border-neutral-200 text-neutral-400'
            )}
          >
            ⭐ {isImportant ? 'Marked Important' : 'Mark as Important'}
          </button>
        </div>

        <FieldWrap label="Notes (Optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you observed..."
            className="min-h-[80px] resize-none"
          />
        </FieldWrap>

        {saved ? (
          <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
            <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Symptom recorded successfully</span>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedSymptom || severity === null || !canWrite}
          >
            Record Symptom
          </Button>
        )}

        {!canWrite && (
          <p className="font-sans text-[11px] text-neutral-400 text-center">
            You don't have permission to add symptoms
          </p>
        )}

        <LabResultsOCR
          onDataExtracted={handleOCRData}
          formType="symptoms"
          title="Extract Symptom Data from Image"
        />
      </CardContent>
    </Card>
  );
};

export default SymptomTracker;
