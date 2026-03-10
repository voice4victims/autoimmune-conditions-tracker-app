import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { triggerService } from '@/lib/firebaseService';

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
  id?: string;
  type: string;
  date: string;
  source: string;
  worsened: boolean | null;
  note: string;
}

const TRIGGER_TYPE_COLORS: Record<string, string> = {
  'Strep Exposure': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'Strep Test (+)': 'bg-red-200 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  'Strep Test (-)': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'Illness/Virus': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'Mold/Environmental': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'Stress Event': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  'Vaccination': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Travel/New Environment': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  'Unknown': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
  'Other': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
};

function getTriggerIcon(type: string): string {
  if (type.includes('(+)')) return '🔴';
  if (type.includes('(-)')) return '🟢';
  if (type.includes('Stress')) return '😰';
  if (type.includes('Virus') || type.includes('Illness')) return '🤧';
  if (type.includes('Mold')) return '🍄';
  if (type.includes('Vacc')) return '💉';
  if (type.includes('Travel')) return '✈️';
  if (type === 'Unknown') return '❓';
  if (type === 'Other') return '📋';
  return '⚠️';
}

const WORSENED_OPTIONS = [
  { value: 'yes', label: 'Yes — symptoms worsened', color: 'border-danger-400 bg-danger-400/10 text-danger-500' },
  { value: 'no', label: 'No change noticed', color: 'border-success-500 bg-success-500/10 text-success-500' },
  { value: 'unknown', label: 'Too early to tell', color: 'border-neutral-300 bg-neutral-100 text-neutral-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
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
  const { user } = useAuth();
  const { childProfile } = useApp();

  const [trigType, setTrigType] = useState('Strep Exposure');
  const [trigDate, setTrigDate] = useState(new Date().toISOString().split('T')[0]);
  const [trigSource, setTrigSource] = useState('');
  const [trigWorsened, setTrigWorsened] = useState<boolean | null>(null);
  const [trigNote, setTrigNote] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<TriggerEntry[]>([]);

  const loadTriggers = async () => {
    if (!user?.uid || !childProfile?.id) return;
    try {
      const triggers = await triggerService.getTriggers(user.uid, childProfile.id);
      setHistory(triggers.map((t: any) => ({
        id: t.id,
        type: t.type || '',
        date: t.date || '',
        source: t.source || '',
        worsened: t.worsened === true ? true : t.worsened === false ? false : null,
        note: t.note || '',
      })));
    } catch (err) {
      console.error('Failed to load triggers:', err);
    }
  };

  useEffect(() => {
    loadTriggers();
  }, [user?.uid, childProfile?.id]);

  const resetForm = () => {
    setTrigType('Strep Exposure');
    setTrigDate(new Date().toISOString().split('T')[0]);
    setTrigSource('');
    setTrigWorsened(null);
    setTrigNote('');
    setEditId(null);
  };

  const handleSave = async () => {
    if (!trigType || !user?.uid || !childProfile?.id) return;
    setLoading(true);
    const data = {
      type: trigType,
      date: trigDate,
      source: trigSource,
      worsened: trigWorsened,
      note: trigNote,
    };
    try {
      if (editId) {
        await triggerService.updateTrigger(editId, data);
        toast({ title: 'Trigger event updated' });
      } else {
        await triggerService.addTrigger(user.uid, childProfile.id, data);
        toast({ title: 'Trigger event logged' });
      }
      resetForm();
      await loadTriggers();
    } catch (err) {
      console.error('Failed to save trigger:', err);
      toast({ title: 'Error saving trigger', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: TriggerEntry) => {
    setTrigType(entry.type);
    setTrigDate(entry.date);
    setTrigSource(entry.source ?? '');
    setTrigWorsened(entry.worsened);
    setTrigNote(entry.note ?? '');
    setEditId(entry.id || null);
  };

  const handleDelete = async (entry: TriggerEntry) => {
    if (!entry.id) return;
    try {
      await triggerService.deleteTrigger(entry.id);
      toast({ title: 'Entry removed' });
      await loadTriggers();
    } catch (err) {
      console.error('Failed to delete trigger:', err);
      toast({ title: 'Error deleting trigger', variant: 'destructive' });
    }
  };

  const editEntry = editId ? history.find((h) => h.id === editId) : null;
  const worsenedStr = worsenedValue(trigWorsened);

  return (
    <div className="space-y-4">
      <div className="bg-warning-50 dark:bg-warning-900/20 rounded-xl p-4 border border-warning-400/50 dark:border-warning-600/40 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-warning-500 dark:text-warning-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-sans font-extrabold text-[13px] text-warning-500 dark:text-warning-400 mb-1">Why Track Triggers?</p>
          <p className="font-sans text-[12px] text-warning-500/80 dark:text-warning-400/70 leading-relaxed">
            Identifying what precedes flares helps your care team prevent recurrence. Strep exposure is the #1
            trigger — log every test, exposure, and illness.
          </p>
        </div>
      </div>

      <Card className={editId !== null ? 'border-2 border-warning-400' : ''}>
        <CardHeader className="pb-2">
          {editId !== null && editEntry && (
            <div className="flex justify-between items-center bg-warning-50 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-700 rounded-lg px-3 py-2 mb-2">
              <span className="font-sans font-extrabold text-[12px] text-warning-600 dark:text-warning-400">
                ✏️ Editing entry from{' '}
                {format(new Date(editEntry.date + 'T12:00:00'), 'MMM d, yyyy')}
              </span>
              <Button variant="ghost" size="sm" className="text-neutral-500 h-auto p-0" onClick={resetForm}>
                ✕ Cancel
              </Button>
            </div>
          )}
          <CardTitle className="font-serif text-xl font-normal text-neutral-800 dark:text-neutral-200">
            {editId !== null ? 'Edit Trigger Event' : 'Log Trigger Event'}
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
                    worsenedStr === opt.value ? opt.color : 'border-neutral-200 text-neutral-400 bg-transparent dark:border-neutral-700 dark:text-neutral-500'
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

          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : editId !== null ? 'Update Trigger Event' : 'Log Trigger Event'}
          </Button>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-sans font-extrabold text-[12px] uppercase tracking-wider text-neutral-500">
              Trigger History
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[500px] overflow-y-auto">
            {history.map((t) => (
              <div key={t.id || t.date + t.type} className="flex gap-3 items-start py-3 first:pt-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[18px] shrink-0">
                  {getTriggerIcon(t.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-2 font-bold border ${TRIGGER_TYPE_COLORS[t.type] || TRIGGER_TYPE_COLORS['Other']}`}
                    >
                      {t.type}
                    </Badge>
                    {t.worsened === true && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-2">
                        ⚡ Flare followed
                      </Badge>
                    )}
                    {t.worsened === false && (
                      <Badge className="text-[10px] py-0 px-2 bg-success-50 text-success-600 border border-success-200 hover:bg-success-50 dark:bg-success-900/30 dark:text-success-400 dark:border-success-800">
                        ✓ No flare
                      </Badge>
                    )}
                    {t.worsened === null && (
                      <Badge className="text-[10px] py-0 px-2 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                        Unknown
                      </Badge>
                    )}
                  </div>
                  <p className="font-sans text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {format(new Date(t.date + 'T12:00:00'), 'MMM d, yyyy')}
                    {t.source ? ` · ${t.source}` : ''}
                  </p>
                  {t.note && (
                    <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 italic">{t.note}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-primary-200 bg-primary-50 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/30 dark:hover:bg-primary-900/50"
                    onClick={() => handleEdit(t)}
                    title="Edit entry"
                  >
                    <Pencil className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-danger-200 bg-danger-50 hover:bg-danger-100 dark:border-danger-800 dark:bg-danger-900/30 dark:hover:bg-danger-900/50"
                    onClick={() => handleDelete(t)}
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-danger-500 dark:text-danger-400" />
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
