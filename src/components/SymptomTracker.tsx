import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SYMPTOM_TYPES, SymptomRating } from '@/types/pandas';
import { toast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/useRoleAccess';
import { ConditionalRender } from '@/components/PermissionGuard';
import PrivacyStatusIndicator from '@/components/PrivacyStatusIndicator';
import LabResultsOCR from './LabResultsOCR';
import { Plus, Calendar as CalendarIcon, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SymptomTrackerProps {
  onAddSymptom: (symptom: SymptomRating) => void;
  customSymptoms?: string[];
  onAddCustomSymptom?: (symptom: string) => void;
}

const SymptomTracker: React.FC<SymptomTrackerProps> = ({
  onAddSymptom,
  customSymptoms = [],
  onAddCustomSymptom
}) => {
  const { canWrite } = usePermissions();
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isImportant, setIsImportant] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const allSymptoms = [...SYMPTOM_TYPES, ...customSymptoms];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSymptom || !severity) {
      toast({ title: 'Error', description: 'Please fill in all required fields' });
      return;
    }

    const symptom: SymptomRating = {
      id: Date.now().toString(),
      symptomType: selectedSymptom,
      severity: parseInt(severity),
      date: format(date, 'yyyy-MM-dd'),
      notes,
      isImportant
    };

    onAddSymptom(symptom);
    setSelectedSymptom('');
    setSeverity('');
    setNotes('');
    setDate(new Date());
    setIsImportant(false);
    toast({ title: 'Success', description: 'Symptom recorded successfully' });
  };

  const handleOCRData = (data: any) => {
    if (data.symptom_name) setSelectedSymptom(data.symptom_name);
    if (data.severity) setSeverity(data.severity.toString());
    if (data.notes) setNotes(data.notes);
  };

  const severityButtons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Record Symptom
          <PrivacyStatusIndicator variant="icon" size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptom" className="text-sm font-medium">Symptom Type</Label>
            <Select value={selectedSymptom} onValueChange={setSelectedSymptom}>
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select symptom" />
              </SelectTrigger>
              <SelectContent>
                {allSymptoms.map((symptom) => (
                  <SelectItem key={symptom} value={symptom}>
                    {symptom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {onAddCustomSymptom && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Symptom
                </Button>
                {showCustomInput && (
                  <CustomSymptomInput
                    onAddCustomSymptom={(symptom) => {
                      onAddCustomSymptom(symptom);
                      setShowCustomInput(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Severity (0-10)</Label>
            <div className="grid grid-cols-6 gap-2">
              {severityButtons.map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={severity === num.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeverity(num.toString())}
                  className="h-10 text-sm"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={isImportant ? "default" : "outline"}
              size="sm"
              onClick={() => setIsImportant(!isImportant)}
              className="flex items-center space-x-2"
            >
              <Star className={cn("w-4 h-4", isImportant && "fill-current")} />
              <span>{isImportant ? "Important" : "Mark as Important"}</span>
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="w-full min-h-[80px] resize-none"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={!selectedSymptom || !severity || !canWrite}
          >
            Record Symptom
          </Button>

          {!canWrite && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              You don't have permission to add symptoms
            </p>
          )}
        </form>

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