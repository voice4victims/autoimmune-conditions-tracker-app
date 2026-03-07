import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const FOOD_TYPES = ['Meal', 'Snack', 'Supplement', 'Beverage', 'Other'];

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

interface FoodDiaryFormProps {
  onAddEntry: (entry: any) => void;
  isLoading?: boolean;
}

const FoodDiaryForm: React.FC<FoodDiaryFormProps> = ({ onAddEntry, isLoading }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('Meal');
  const [foodName, setFoodName] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName) return;

    onAddEntry({
      date,
      meal_type: mealType,
      food_name: foodName,
      notes: notes || null
    });

    setFoodName('');
    setNotes('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3.5">
        <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">Food Journal</h3>

        <FieldWrap label="Food / Meal">
          <Input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Oatmeal with blueberries..." />
        </FieldWrap>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Type">
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldWrap>
          <FieldWrap label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FieldWrap>
        </div>

        <FieldWrap label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reactions, amounts, context..." className="min-h-[68px] resize-none" />
        </FieldWrap>

        {saved ? (
          <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
            <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Entry saved</span>
          </div>
        ) : (
          <Button className="w-full" onClick={handleSubmit} disabled={isLoading || !foodName}>
            {isLoading ? 'Saving...' : 'Save Entry'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodDiaryForm;
