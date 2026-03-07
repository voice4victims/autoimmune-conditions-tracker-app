import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const TRIGGER_TYPES = [
  'Strep Exposure',
  'Strep Test (+)',
  'Strep Test (-)',
  'Illness/Virus',
  'Mold/Environmental',
  'Stress Event',
  'Vaccination',
  'Travel/New Environment',
  'Unknown',
  'Other',
];

interface TriggerEntry {
  type: string;
  date: string;
  source: string;
  worsened: boolean | null;
  note: string;
}

function getTriggerIcon(type: string): string {
  if (type.includes('(+)')) return '🔴';
  if (type.includes('(-)')) return '🟢';
  if (type.includes('Stress')) return '😰';
  if (type.includes('Virus') || type.includes('Illness')) return '🤧';
  if (type.includes('Mold')) return '🍄';
  if (type.includes('Vacc')) return '💉';
  return '⚠️';
}

function getTriggerColor(type: string): string {
  if (type.includes('(+)')) return 'text-danger-500';
  if (type.includes('Strep')) return 'text-danger-400';
  if (type.includes('Illness') || type.includes('Virus')) return 'text-purple-600';
  if (type.includes('Stress')) return 'text-warning-500';
  return 'text-neutral-500';
}

const WORSENED_OPTIONS = [
  { value: 'yes', label: 'Yes — symptoms worsened', color: 'border-danger-400 bg-danger-400/10 text-danger-500' },
  { value: 'no', label: 'No change noticed', color: 'border-success-500 bg-success-500/10 text-success-500' },
  { value: 'unknown', label: 'Too early to tell', color: 'border-neutral-300 bg-neutral-100 text-neutral-400' },
];

function worsenedValue(v: boolean | null): string {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return 'unknown';
}

function parseWorsened(v: string): boolean | null {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

const TriggerTracker: React.FC = () => {
  const { toast } = useToast();

  const [trigType, setTrigType] = useState('Strep Exposure');
  const [trigDate, setTrigDate] = useState(new Date().toISOString().split('T')[0]);
  const [trigSource, setTrigSource] = useState('');
  const [trigWorsened, setTrigWorsened] = useState<boolean | null>(null);
  const [trigNote, setTrigNote] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const [history, setHistory] = useState<TriggerEntry[]>([]);

  const resetForm = () => {
    setTrigType('Strep Exposure');
    setTrigDate(new Date().toISOString().split('T')[0]);
    setTrigSource('');
    setTrigWorsened(null);
    setTrigNote('');
    setEditIdx(null);
  };

  const handleSave = () => {
    if (!trigType) return;
    const entry: TriggerEntry = {
      type: trigType,
      date: trigDate,
      source: trigSource,
      worsened: trigWorsened,
      note: trigNote,
    };
    if (editIdx !== null) {
      setHistory((h) => h.map((x, i) => (i === editIdx ? entry : x)));
      toast({ title: 'Trigger event updated' });
    } else {
      setHistory((h) => [entry, ...h]);
      toast({ title: 'Trigger event logged' });
    }
    resetForm();
  };

  const handleEdit = (i: number) => {
    const t = history[i];
    setTrigType(t.type);
    setTrigDate(t.date);
    setTrigSource(t.source ?? '');
    setTrigWorsened(t.worsened);
    setTrigNote(t.note ?? '');
    setEditIdx(i);
  };

  const handleDelete = (i: number) => {
    setHistory((h) => h.filter((_, j) => j !== i));
    toast({ title: 'Entry removed' });
  };

  const worsenedStr = worsenedValue(trigWorsened);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-warning-50 rounded-xl p-4 border border-warning-400/50 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-sans font-extrabold text-[13px] text-warning-500 mb-1">Why Track Triggers?</p>
          <p className="font-sans text-[12px] text-warning-500/80 leading-relaxed">
            Identifying what precedes flares helps your care team prevent recurrence. Strep exposure is the #1
            trigger — log every test, exposure, and illness.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className={editIdx !== null ? 'border-2 border-warning-400' : ''}>
        <CardHeader className="pb-2">
          {editIdx !== null && (
            <div className="flex justify-between items-center bg-warning-50 border border-warning-200 rounded-lg px-3 py-2 mb-2">
              <span className="font-sans font-extrabold text-[12px] text-warning-600">
                ✏️ Editing entry from{' '}
                {format(new Date(history[editIdx]?.date + 'T12:00:00'), 'MMM d, yyyy')}
              </span>
              <Button variant="ghost" size="sm" className="text-neutral-500 h-auto p-0" onClick={resetForm}>
                ✕ Cancel
              </Button>
            </div>
          )}
          <CardTitle className="font-serif text-xl font-normal text-neutral-800">
            {editIdx !== null ? 'Edit Trigger Event' : 'Log Trigger Event'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
                Trigger Type
              </Label>
              <Select value={trigType} onValueChange={setTrigType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
                Date
              </Label>
              <Input type="date" value={trigDate} onChange={(e) => setTrigDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Source / Location
            </Label>
            <Input
              value={trigSource}
              onChange={(e) => setTrigSource(e.target.value)}
              placeholder="e.g. classroom, sibling, community pool…"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Did symptoms worsen within 2 weeks?
            </Label>
            <div className="flex gap-2 mt-1">
              {WORSENED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTrigWorsened(parseWorsened(opt.value))}
                  className={`flex-1 py-2 px-1.5 rounded-lg border-[1.5px] font-sans font-bold text-[11px] cursor-pointer leading-tight transition-colors ${
                    worsenedStr === opt.value ? opt.color : 'border-neutral-200 text-neutral-400 bg-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Notes
            </Label>
            <Textarea
              value={trigNote}
              onChange={(e) => setTrigNote(e.target.value)}
              placeholder="Any additional context…"
              className="min-h-[68px] resize-none"
            />
          </div>

          <Button className="w-full" onClick={handleSave}>
            {editIdx !== null ? 'Update Trigger Event' : 'Log Trigger Event'}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-sans font-extrabold text-[12px] uppercase tracking-wider text-neutral-500">
              Trigger History
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100">
            {history.map((t, i) => (
              <div key={i} className="flex gap-3 items-start py-3 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-[18px] shrink-0">
                  {getTriggerIcon(t.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-sans font-extrabold text-[13px] ${getTriggerColor(t.type)}`}>
                      {t.type}
                    </span>
                    {t.worsened === true && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-2">
                        ⚡ Flare followed
                      </Badge>
                    )}
                    {t.worsened === false && (
                      <Badge className="text-[10px] py-0 px-2 bg-success-50 text-success-600 border border-success-200 hover:bg-success-50">
                        ✓ No flare
                      </Badge>
                    )}
                  </div>
                  <p className="font-sans text-[11px] text-neutral-400 mt-0.5">
                    {format(new Date(t.date + 'T12:00:00'), 'MMM d, yyyy')}
                    {t.source ? ` · ${t.source}` : ''}
                  </p>
                  {t.note && (
                    <p className="font-sans text-[12px] text-neutral-500 mt-1 italic">{t.note}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-primary-200 bg-primary-50 hover:bg-primary-100"
                    onClick={() => handleEdit(i)}
                    title="Edit entry"
                  >
                    <Pencil className="w-3.5 h-3.5 text-primary-600" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-danger-200 bg-danger-50 hover:bg-danger-100"
                    onClick={() => handleDelete(i)}
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-danger-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TriggerTracker;
