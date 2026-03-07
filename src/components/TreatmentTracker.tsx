import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TREATMENT_TYPES = ['Antibiotic', 'Anti-inflammatory', 'Supplement', 'Behavioral Therapy', 'IVIG', 'Plasmapheresis', 'Other'];

const SIDE_EFFECT_OPTIONS = [
  'Worsened PANS symptoms', 'Increased OCD', 'Increased anxiety', 'Increased tics',
  'Rage / aggression', 'Behavioral regression', 'Hyperactivity', 'Insomnia',
  'GI upset / nausea', 'Diarrhea', 'Rash / hives', 'Headache',
  'Fatigue', 'Loss of appetite', 'Yeast overgrowth', 'Herxheimer reaction', 'Other',
];

const HELP_LEVELS = [
  { v: 0, l: 'No effect', emoji: '😐' },
  { v: 1, l: 'Minimal help', emoji: '🟡' },
  { v: 2, l: 'Moderate help', emoji: '🟠' },
  { v: 3, l: 'Significant help', emoji: '🟢' },
  { v: 4, l: 'Full remission', emoji: '✨' },
];

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

const TreatmentTracker: React.FC = () => {
  const { childProfile, treatments, addTreatment, loadTreatments } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const [tType, setTType] = useState('Antibiotic');
  const [tName, setTName] = useState('');
  const [tDose, setTDose] = useState('');
  const [tStartDate, setTStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [tEndDate, setTEndDate] = useState('');
  const [tStatus, setTStatus] = useState<'active' | 'discontinued' | 'failed'>('active');
  const [tHelpRating, setTHelpRating] = useState<number | null>(null);
  const [tWorsenedPans, setTWorsenedPans] = useState(false);
  const [tSideEffects, setTSideEffects] = useState<string[]>([]);
  const [tFailReason, setTFailReason] = useState('');
  const [tNote, setTNote] = useState('');

  useEffect(() => {
    if (childProfile) loadTreatments();
  }, [childProfile]);

  const toggleSideEffect = (se: string) => {
    setTSideEffects((prev) =>
      prev.includes(se) ? prev.filter((s) => s !== se) : [...prev, se]
    );
  };

  const resetForm = () => {
    setTName(''); setTDose(''); setTNote(''); setTStatus('active');
    setTHelpRating(null); setTWorsenedPans(false); setTSideEffects([]);
    setTFailReason(''); setTEndDate(''); setEditIdx(null);
    setTStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    if (!tName || !childProfile) return;
    try {
      setLoading(true);
      await addTreatment({
        treatment_type: tType,
        medication_name: tName,
        dosage: tDose,
        administration_date: tStartDate,
        end_date: tStatus !== 'active' ? tEndDate : '',
        status: tStatus,
        help_rating: tHelpRating,
        worsened_pans: tWorsenedPans,
        side_effects: tSideEffects,
        fail_reason: tFailReason,
        improvement_notes: tNote,
      });
      resetForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save treatment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">💊</p>
          <p className="font-serif text-xl text-neutral-700 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Please select a child to track treatments</p>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    active: 'bg-success-50 text-success-600 border-success-200',
    discontinued: 'bg-neutral-100 text-neutral-500 border-neutral-200',
    failed: 'bg-danger-50 text-danger-500 border-danger-200',
  };

  return (
    <div className="space-y-4">
      <Card className={editIdx !== null ? 'border-2 border-warning-400' : ''}>
        <CardContent className="p-4 space-y-3.5">
          {editIdx !== null && (
            <div className="flex justify-between items-center bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
              <span className="font-sans font-extrabold text-[12px] text-warning-600">✏️ Editing treatment</span>
              <button onClick={resetForm} className="font-sans font-extrabold text-[11px] text-neutral-500 bg-transparent border-none cursor-pointer">✕ Cancel</button>
            </div>
          )}
          <h3 className="font-serif text-xl text-neutral-800 m-0">
            {editIdx !== null ? 'Edit Treatment' : 'Log Treatment'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Type">
              <Select value={tType} onValueChange={setTType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TREATMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldWrap>
            <FieldWrap label="Start Date">
              <Input type="date" value={tStartDate} onChange={(e) => setTStartDate(e.target.value)} />
            </FieldWrap>
          </div>

          <FieldWrap label="Name / Medication">
            <Input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="e.g. Amoxicillin 500mg" />
          </FieldWrap>

          <FieldWrap label="Dosage">
            <Input value={tDose} onChange={(e) => setTDose(e.target.value)} placeholder="e.g. 500mg twice daily" />
          </FieldWrap>

          <FieldWrap label="Treatment Status">
            <div className="flex gap-2">
              {([['active', 'Active', 'bg-success-50 border-success-400 text-success-600'],
                 ['discontinued', 'Stopped', 'bg-neutral-100 border-neutral-300 text-neutral-500'],
                 ['failed', 'Failed', 'bg-danger-50 border-danger-400 text-danger-500']] as const).map(([v, l, cls]) => (
                <button key={v} onClick={() => setTStatus(v)}
                  className={cn('flex-1 py-2 rounded-lg border-[1.5px] font-sans font-bold text-[12px] cursor-pointer transition-all',
                    tStatus === v ? cls : 'border-neutral-200 text-neutral-400 bg-transparent')}>
                  {l}
                </button>
              ))}
            </div>
          </FieldWrap>

          {tStatus !== 'active' && (
            <FieldWrap label="End Date">
              <Input type="date" value={tEndDate} onChange={(e) => setTEndDate(e.target.value)} />
            </FieldWrap>
          )}

          <FieldWrap label="How much did it help?">
            <div className="flex gap-1.5 flex-wrap">
              {HELP_LEVELS.map((hl) => (
                <button key={hl.v} onClick={() => setTHelpRating(hl.v)}
                  className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-[1.5px] font-sans font-bold text-[11px] cursor-pointer transition-all',
                    tHelpRating === hl.v ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-neutral-200 text-neutral-400')}>
                  {hl.emoji} {hl.l}
                </button>
              ))}
            </div>
          </FieldWrap>

          <div>
            <button
              onClick={() => setTWorsenedPans((v) => !v)}
              className={cn('inline-flex items-center gap-2 px-3 py-2 rounded-lg border-[1.5px] font-sans font-bold text-[12px] cursor-pointer transition-all',
                tWorsenedPans ? 'border-danger-400 bg-danger-50 text-danger-500' : 'border-neutral-200 text-neutral-400')}
            >
              ⚠️ {tWorsenedPans ? 'Worsened PANS symptoms' : 'Mark if it worsened PANS'}
            </button>
          </div>

          <FieldWrap label="Side Effects">
            <div className="flex flex-wrap gap-1.5">
              {SIDE_EFFECT_OPTIONS.map((se) => (
                <button key={se} onClick={() => toggleSideEffect(se)}
                  className={cn('px-2.5 py-1 rounded-full border-[1.5px] font-sans font-bold text-[11px] cursor-pointer transition-all',
                    tSideEffects.includes(se) ? 'border-secondary-400 bg-secondary-50 text-secondary-600' : 'border-neutral-200 text-neutral-400')}>
                  {se}
                </button>
              ))}
            </div>
          </FieldWrap>

          {tStatus === 'failed' && (
            <FieldWrap label="Reason for Discontinuation">
              <Textarea value={tFailReason} onChange={(e) => setTFailReason(e.target.value)} placeholder="Why was treatment stopped or deemed ineffective?" className="min-h-[68px] resize-none" />
            </FieldWrap>
          )}

          <FieldWrap label="Notes">
            <Textarea value={tNote} onChange={(e) => setTNote(e.target.value)} placeholder="Observations, tolerability, outcomes..." className="min-h-[68px] resize-none" />
          </FieldWrap>

          {saved ? (
            <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
              <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Treatment saved</span>
            </div>
          ) : (
            <Button className="w-full" onClick={handleSave} disabled={loading || !tName}>
              {loading ? 'Saving...' : editIdx !== null ? 'Update Treatment' : 'Save Treatment'}
            </Button>
          )}
        </CardContent>
      </Card>

      {treatments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 uppercase tracking-[0.07em] mb-3">
              Treatment History
            </p>
            <div className="divide-y divide-neutral-100">
              {treatments.map((t, i) => (
                <div key={t.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-extrabold text-[13px] text-neutral-800">{t.medication_name}</span>
                        {t.status && (
                          <Badge className={cn('text-[10px] py-0 px-2 border', statusColors[t.status] || statusColors.active)}>
                            {t.status}
                          </Badge>
                        )}
                        {t.help_rating != null && (
                          <span className="text-[11px]">{HELP_LEVELS[t.help_rating]?.emoji}</span>
                        )}
                      </div>
                      <p className="font-sans text-[11px] text-neutral-400 mt-0.5">
                        {t.treatment_type}{t.dosage ? ` · ${t.dosage}` : ''} · {t.administration_date}
                      </p>
                      {t.side_effects && t.side_effects.length > 0 && (
                        <p className="font-sans text-[11px] text-neutral-400 mt-0.5">Side effects: {t.side_effects.join(', ')}</p>
                      )}
                      {t.improvement_notes && <p className="font-sans text-[12px] text-neutral-500 mt-1 italic">{t.improvement_notes}</p>}
                    </div>
                    <button
                      onClick={() => {
                        setEditIdx(i);
                        setTType(t.treatment_type); setTName(t.medication_name); setTDose(t.dosage || '');
                        setTStartDate(t.administration_date); setTEndDate(t.end_date || '');
                        setTStatus(t.status || 'active'); setTHelpRating(t.help_rating ?? null);
                        setTWorsenedPans(t.worsened_pans || false); setTSideEffects(t.side_effects || []);
                        setTFailReason(t.fail_reason || ''); setTNote(t.improvement_notes || '');
                      }}
                      className="text-[11px] text-primary-500 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TreatmentTracker;
