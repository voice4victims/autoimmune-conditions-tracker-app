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
  { v: 0, l: 'No effect', emoji: '😐', color: 'text-neutral-400' },
  { v: 1, l: 'Minimal help', emoji: '🟡', color: 'text-warning-400' },
  { v: 2, l: 'Moderate help', emoji: '🟠', color: 'text-orange-500' },
  { v: 3, l: 'Significant help', emoji: '🟢', color: 'text-success-500' },
  { v: 4, l: 'Full remission', emoji: '✨', color: 'text-success-600' },
];

const isWarningSideEffect = (se: string) =>
  se.includes('PANS') || se.includes('OCD') || se.includes('anxiety') || se.includes('tics') ||
  se.includes('Rage') || se.includes('regression') || se.includes('Herx');

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5 mb-3.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

const ESCALATION_TIERS = [
  {
    level: 1, icon: '💊', label: 'Tier 1 — Prophylactic Antibiotic',
    treatment: 'Amoxicillin 250mg',
    periodMain: 'Mar – Jun 2025', periodSub: '14 weeks',
    colorClass: 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30',
    iconBg: 'bg-green-600',
    labelColor: 'text-green-600 dark:text-green-400',
    rationale: 'First-line standard of care for PANDAS. Low-dose prophylactic antibiotic to prevent strep reinfection and reduce neuroinflammatory trigger.',
    outcome: 'Partial response',
    outcomeColor: 'text-amber-600',
    outcomeDetail: 'OCD and anxiety reduced ~30%. Sleep and tics unchanged. Strep titers remained elevated (ASO 620 IU/mL). Pediatrician recommended antibiotic switch.',
    decisionToEscalate: 'Incomplete symptom control after full trial period. Persistent elevated titers despite compliance. Decision: trial alternate antibiotic class.',
    connector: true,
    connectorColor: 'from-green-500 to-red-500',
  },
  {
    level: 2, icon: '⚠️', label: 'Tier 2 — Alternate Antibiotic Class',
    treatment: 'Azithromycin 250mg',
    periodMain: 'Jul – Oct 2025', periodSub: '15 weeks',
    colorClass: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30',
    iconBg: 'bg-red-500',
    labelColor: 'text-red-500 dark:text-red-400',
    rationale: 'Macrolide antibiotic with anti-inflammatory properties in addition to antimicrobial action. Often used when beta-lactams provide incomplete response.',
    outcome: 'Treatment failure',
    outcomeColor: 'text-red-500',
    outcomeDetail: 'Significant PANS worsening by week 2. OCD intensified, rage episodes increased. Suspected Herxheimer reaction or yeast overgrowth. Anti-DNase B rose to 640 U/mL.',
    decisionToEscalate: 'Discontinued after 15 weeks due to active worsening. PANDAS symptoms at worst point since onset. Immunology referral placed. Decision: escalate to immunomodulatory therapy.',
    connector: true,
    connectorColor: 'from-red-500 to-purple-500',
  },
  {
    level: 3, icon: '🧪', label: 'Tier 3 — Anti-Inflammatory Bridge',
    treatment: 'Ibuprofen 400mg 3x/day + NSAIDs',
    periodMain: 'Oct – Nov 2025', periodSub: '6 weeks',
    colorClass: 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30',
    iconBg: 'bg-purple-600',
    labelColor: 'text-purple-600 dark:text-purple-400',
    rationale: 'Short-course NSAID therapy to reduce neuroinflammation while awaiting immunology evaluation and IVIG insurance authorization. Published PANDAS literature supports NSAID response as a diagnostic indicator.',
    outcome: 'Modest improvement',
    outcomeColor: 'text-amber-600',
    outcomeDetail: '20–25% symptom reduction. OCD compulsions less frequent but still severe. Sleep improved marginally. Confirmed NSAID responsiveness consistent with autoimmune encephalitis pattern.',
    decisionToEscalate: 'NSAID response confirmed autoimmune etiology. Cunningham Panel returned: CaM Kinase II at 151% (elevated). Immunologist authorized IVIG. Decision: proceed to IVIG.',
    connector: true,
    connectorColor: 'from-purple-500 to-primary-500',
  },
  {
    level: 4, icon: '💉', label: 'Tier 4 — IVIG Immunotherapy',
    treatment: 'IVIG 2g/kg over 2 days',
    periodMain: 'Sep 15–16, 2025', periodSub: 'Infusion complete',
    colorClass: 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/30',
    iconBg: 'bg-primary-600',
    labelColor: 'text-primary-600 dark:text-primary-400',
    rationale: 'High-dose intravenous immunoglobulin. Modulates immune response, reduces autoantibody activity, and resets dysregulated B-cell activity. Evidence-supported for PANDAS/PANS with confirmed autoimmune markers.',
    outcome: 'Significant improvement — Full remission by week 4',
    outcomeColor: 'text-success-600',
    outcomeDetail: 'Weeks 1–2: headache and fatigue (expected side effects). Week 3: noticeable OCD reduction. Week 4: near-full remission. Symptom scores dropped from 8–9/10 to 1–2/10. ASO titer declined to 320 IU/mL.',
    decisionToEscalate: null,
    connector: false,
    connectorColor: '',
    isCurrent: true,
  },
];

const EscalationPath: React.FC = () => (
  <Card className="border-[1.5px] border-primary-200 dark:border-primary-700 bg-gradient-to-b from-blue-50/50 to-white dark:from-primary-950/20 dark:to-neutral-900">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[22px]">🔬</span>
        <div>
          <p className="font-serif text-[17px] text-primary-700 dark:text-primary-300 m-0">Treatment Escalation Path</p>
          <p className="font-sans text-[11px] text-neutral-400 m-0">Clinical decision history leading to IVIG</p>
        </div>
      </div>
      <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
        Each treatment level was trialed based on response, intolerance, or worsening. Decisions were made in consultation with immunology and neurology.
      </p>

      {ESCALATION_TIERS.map((step, i) => (
        <div key={i} className="relative">
          {step.connector && (
            <div className={cn('absolute left-5 w-0.5 h-5 bg-gradient-to-b', step.connectorColor)} style={{ top: '100%', zIndex: 1 }} />
          )}
          <div className={cn(
            'border-2 rounded-[14px] p-3.5 relative',
            step.colorClass,
            step.connector ? 'mb-5' : 'mb-0',
            (step as any).isCurrent && 'ring-[3px] ring-primary-200 dark:ring-primary-700 shadow-lg'
          )}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className={cn('w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0', step.iconBg)}>
                {step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className={cn('font-sans font-extrabold text-[11px] uppercase tracking-[0.07em] m-0', step.labelColor)}>{step.label}</p>
                  {(step as any).isCurrent && (
                    <span className="bg-primary-500 text-white rounded-full px-2 py-0.5 text-[9px] font-extrabold">CURRENT</span>
                  )}
                </div>
                <p className="font-serif text-[15px] text-neutral-800 dark:text-neutral-100 mt-0.5 m-0">{step.treatment}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn('font-sans font-extrabold text-[11px] m-0', step.labelColor)}>{step.periodMain}</p>
                <p className="font-sans font-semibold text-[11px] text-neutral-400 m-0">{step.periodSub}</p>
              </div>
            </div>

            <div className="bg-white/65 dark:bg-neutral-800/40 rounded-[10px] p-2.5 px-3 mb-2.5 border border-black/[.06] dark:border-white/[.06]">
              <p className="font-sans font-extrabold text-[10px] text-neutral-400 uppercase tracking-[0.06em] mb-1">Clinical Rationale</p>
              <p className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">{step.rationale}</p>
            </div>

            <div className="bg-white/65 dark:bg-neutral-800/40 rounded-[10px] p-2.5 px-3 border border-black/[.06] dark:border-white/[.06] mb-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="font-sans font-extrabold text-[10px] text-neutral-400 uppercase tracking-[0.06em] m-0">Outcome</p>
                <span className={cn('font-sans font-extrabold text-[11px]', step.outcomeColor)}>{step.outcome}</span>
              </div>
              <p className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">{step.outcomeDetail}</p>
            </div>

            {step.decisionToEscalate && (
              <div className="bg-black/[.04] dark:bg-white/[.04] rounded-[10px] p-2.5 px-3 border border-dashed border-current/20 flex gap-2 items-start">
                <span className="text-[14px] flex-shrink-0 mt-0.5">→</span>
                <div>
                  <p className={cn('font-sans font-extrabold text-[10px] uppercase tracking-[0.06em] mb-0.5', step.labelColor)}>Decision to Escalate</p>
                  <p className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">{step.decisionToEscalate}</p>
                </div>
              </div>
            )}

            {(step as any).isCurrent && (
              <div className="bg-gradient-to-r from-success-50 to-green-50 dark:from-success-950/30 dark:to-green-950/30 rounded-[10px] p-2.5 px-3 mt-2.5 border border-success-200 dark:border-success-700 flex gap-2 items-center">
                <span className="text-[20px]">🎉</span>
                <p className="font-sans text-[12px] font-bold text-success-600 dark:text-success-400 leading-relaxed m-0">
                  IVIG resulted in near-full remission. Continuing Amoxicillin prophylaxis. Next infusion evaluation in 6 months.
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-3 mt-4 flex-wrap">
        {[
          { emoji: '🟡', l: 'Partial response' },
          { emoji: '🔴', l: 'Treatment failure' },
          { emoji: '🟢', l: 'Improvement / Remission' },
          { emoji: '→', l: 'Decision to escalate' },
        ].map((leg) => (
          <div key={leg.l} className="flex items-center gap-1">
            <span className="text-[13px]">{leg.emoji}</span>
            <span className="font-sans text-[10px] text-neutral-400 font-semibold">{leg.l}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const getDuration = (startDate: string, endDate?: string) => {
  const startMs = new Date(startDate + 'T12:00:00').getTime();
  const endMs = endDate ? new Date(endDate + 'T12:00:00').getTime() : Date.now();
  const days = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24));
  if (days < 0) return '0d';
  const wks = Math.floor(days / 7);
  return wks > 0 ? `${wks}w ${days % 7}d` : `${days}d`;
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const TreatmentTracker: React.FC = () => {
  const { childProfile, treatments, addTreatment, deleteTreatment, loadTreatments } = useApp();
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
  const [tCustomSideEffect, setTCustomSideEffect] = useState('');
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
    setTCustomSideEffect(''); setTFailReason(''); setTEndDate(''); setEditIdx(null);
    setTStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    if (!tName || !childProfile) return;
    try {
      setLoading(true);
      const allSideEffects = tCustomSideEffect ? [...tSideEffects, tCustomSideEffect] : tSideEffects;
      await addTreatment({
        treatment_type: tType,
        medication_name: tName,
        dosage: tDose,
        administration_date: tStartDate,
        end_date: tStatus !== 'active' ? tEndDate : '',
        status: tStatus,
        help_rating: tHelpRating,
        worsened_pans: tWorsenedPans,
        side_effects: allSideEffects,
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

  const handleDelete = async (treatmentId: string) => {
    try {
      await deleteTreatment(treatmentId);
      toast({ title: 'Deleted', description: 'Treatment record removed' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete treatment', variant: 'destructive' });
    }
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">💊</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Please select a child to track treatments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={editIdx !== null ? 'border-2 border-warning-400' : ''}>
        <CardContent className="p-4 space-y-0">
          {editIdx !== null && (
            <div className="flex justify-between items-center bg-warning-50 border border-warning-200 rounded-lg px-3 py-2 mb-3">
              <span className="font-sans font-extrabold text-[12px] text-warning-600">✏️ Editing: {treatments[editIdx]?.medication_name}</span>
              <button onClick={resetForm} className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 bg-transparent border-none cursor-pointer">✕ Cancel</button>
            </div>
          )}
          <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">
            {editIdx !== null ? 'Edit Treatment' : 'Record Treatment'}
          </h3>
          <p className="font-sans text-[12px] text-neutral-400 mt-1 mb-4">Log a medication, therapy, or supplement — including how it's working</p>

          <FieldWrap label="Treatment Type">
            <Select value={tType} onValueChange={setTType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TREATMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldWrap>

          <FieldWrap label="Medication / Treatment Name">
            <Input value={tName} onChange={(e) => setTName(e.target.value)} placeholder="e.g. Amoxicillin, IVIG, NAC…" />
          </FieldWrap>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrap label="Dosage">
              <Input value={tDose} onChange={(e) => setTDose(e.target.value)} placeholder="e.g. 500mg 2x/day" />
            </FieldWrap>
            <FieldWrap label="Start Date">
              <Input type="date" value={tStartDate} onChange={(e) => setTStartDate(e.target.value)} />
            </FieldWrap>
          </div>

          <FieldWrap label="Current Status">
            <div className="grid grid-cols-3 gap-2 mt-1">
              {([
                { v: 'active' as const, l: 'Still Taking', emoji: '✅', activeClass: 'border-success-400 bg-success-50/50 text-success-600' },
                { v: 'discontinued' as const, l: 'Stopped', emoji: '⏹️', activeClass: 'border-neutral-400 bg-neutral-100 text-neutral-500' },
                { v: 'failed' as const, l: 'Failed / Worse', emoji: '❌', activeClass: 'border-danger-400 bg-danger-50/50 text-danger-500' },
              ]).map((s) => (
                <button key={s.v} onClick={() => setTStatus(s.v)}
                  className={cn(
                    'py-2.5 px-1.5 rounded-xl border-2 cursor-pointer transition-all text-center',
                    tStatus === s.v ? s.activeClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 bg-transparent'
                  )}>
                  <div className="text-[18px] mb-1">{s.emoji}</div>
                  <p className="font-sans font-extrabold text-[11px] m-0 leading-tight">{s.l}</p>
                </button>
              ))}
            </div>
          </FieldWrap>

          {tStatus !== 'active' && (
            <FieldWrap label={tStatus === 'failed' ? 'Date Discontinued' : 'End Date'}>
              <Input type="date" value={tEndDate} onChange={(e) => setTEndDate(e.target.value)} />
            </FieldWrap>
          )}

          <FieldWrap label="How much did this help?">
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {HELP_LEVELS.map((hl) => (
                <button key={hl.v} onClick={() => setTHelpRating(tHelpRating === hl.v ? null : hl.v)}
                  className={cn(
                    'py-2.5 px-1 rounded-xl border-2 cursor-pointer transition-all text-center',
                    tHelpRating === hl.v
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                      : 'border-neutral-200 dark:border-neutral-700 bg-transparent'
                  )}>
                  <div className="text-[20px] mb-0.5">{hl.emoji}</div>
                  <p className={cn(
                    'font-sans font-bold text-[9px] m-0 leading-tight',
                    tHelpRating === hl.v ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-400'
                  )}>{hl.l}</p>
                </button>
              ))}
            </div>
          </FieldWrap>

          <div className="mb-3.5">
            <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em] block mb-2">
              Did this worsen PANS/PANDAS symptoms?
            </label>
            <div className="flex gap-2.5">
              {([
                { v: true, l: 'Yes — made it worse', prefix: '⚠️', activeClass: 'border-danger-400 bg-danger-50/40 text-danger-500' },
                { v: false, l: 'No / not sure', prefix: '✓', activeClass: 'border-neutral-400 bg-neutral-100 text-neutral-500' },
              ] as const).map((opt) => (
                <button key={String(opt.v)} onClick={() => setTWorsenedPans(opt.v)}
                  className={cn(
                    'flex-1 py-3 px-3 rounded-xl border-2 font-sans font-extrabold text-[12px] cursor-pointer transition-all',
                    tWorsenedPans === opt.v ? opt.activeClass : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 bg-transparent'
                  )}>
                  {opt.prefix} {opt.l}
                </button>
              ))}
            </div>
            {tWorsenedPans && (
              <div className="bg-danger-50 dark:bg-danger-950/30 border border-danger-100 dark:border-danger-800 rounded-lg p-2.5 px-3 mt-2">
                <p className="font-sans text-[12px] text-danger-600 dark:text-danger-400 leading-relaxed m-0">
                  ⚠️ This is important clinical information. Document this in your Notes below and share with your prescribing doctor — PANS worsening on antibiotics may indicate yeast overgrowth, a Herxheimer reaction, or the wrong treatment choice.
                </p>
              </div>
            )}
          </div>

          <FieldWrap label="Observed Side Effects (select all that apply)">
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {SIDE_EFFECT_OPTIONS.map((se) => {
                const active = tSideEffects.includes(se);
                const isWarn = isWarningSideEffect(se);
                return (
                  <button key={se} onClick={() => toggleSideEffect(se)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border-[1.5px] font-sans font-bold text-[11px] cursor-pointer transition-all',
                      active
                        ? isWarn
                          ? 'border-danger-400 bg-danger-50/50 text-danger-500'
                          : 'border-primary-400 bg-primary-50 text-primary-600'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-400'
                    )}>
                    {isWarn && active ? '⚠️ ' : ''}{se}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2.5">
              <Input
                value={tCustomSideEffect}
                onChange={(e) => setTCustomSideEffect(e.target.value)}
                placeholder="Add custom side effect…"
                className="flex-1 text-[12px]"
              />
              {tCustomSideEffect && (
                <button
                  onClick={() => { toggleSideEffect(tCustomSideEffect); setTCustomSideEffect(''); }}
                  className="px-3.5 py-1.5 rounded-lg border-[1.5px] border-primary-300 bg-primary-50 font-sans font-bold text-[12px] text-primary-500 cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </FieldWrap>

          {tStatus === 'failed' && (
            <FieldWrap label="Why did this fail / what happened?">
              <Textarea value={tFailReason} onChange={(e) => setTFailReason(e.target.value)}
                placeholder="Describe what caused you to stop — worsening symptoms, ineffectiveness, side effects, doctor advice…"
                className="min-h-[80px] resize-none bg-red-50/50 dark:bg-red-950/20 border-danger-200 dark:border-danger-800" />
            </FieldWrap>
          )}

          <FieldWrap label="Additional Notes">
            <Textarea value={tNote} onChange={(e) => setTNote(e.target.value)}
              placeholder="Any other observations, context, or reactions…"
              className="min-h-[80px] resize-none" />
          </FieldWrap>

          {saved ? (
            <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
              <span className="font-sans font-extrabold text-[14px] text-success-600">✓ Treatment recorded</span>
            </div>
          ) : (
            <Button className="w-full" onClick={handleSave} disabled={loading || !tName}>
              {loading ? 'Saving...' : editIdx !== null ? 'Update Treatment' : 'Save Treatment Record'}
            </Button>
          )}
        </CardContent>
      </Card>

      <EscalationPath />

      {treatments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-3.5">
              Treatment History
            </p>
            {treatments.map((t, i) => {
              const dur = getDuration(t.administration_date, t.end_date);
              const hl = HELP_LEVELS.find((h) => h.v === t.help_rating);
              const statusStyle = t.status === 'active'
                ? { cls: 'bg-success-50 border-success-200 text-success-600', label: 'Active' }
                : t.status === 'failed'
                  ? { cls: 'bg-danger-50 border-danger-200 text-danger-500', label: 'Failed' }
                  : { cls: 'bg-neutral-100 border-neutral-200 text-neutral-500', label: 'Stopped' };
              return (
                <div key={t.id} className={cn('py-3.5', i > 0 && 'border-t border-neutral-100 dark:border-neutral-800')}>
                  <div className="flex justify-between items-start gap-2.5 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-extrabold text-[14px] text-neutral-800 dark:text-neutral-100 m-0 mb-0.5">{t.medication_name}</p>
                      <p className="font-sans text-[11px] text-neutral-400 m-0">{t.treatment_type}{t.dosage ? ` · ${t.dosage}` : ''}</p>
                    </div>
                    <Badge className={cn('text-[11px] py-0.5 px-2.5 border rounded-full font-extrabold flex-shrink-0', statusStyle.cls)}>
                      {statusStyle.label}
                    </Badge>
                  </div>

                  <div className="flex gap-4 flex-wrap mb-2">
                    <div>
                      <span className="font-sans text-[10px] text-neutral-400 font-bold uppercase tracking-[0.05em]">Duration</span>
                      <p className="font-mono text-[13px] text-neutral-700 dark:text-neutral-300 font-medium mt-0.5 m-0">{dur}</p>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-neutral-400 font-bold uppercase tracking-[0.05em]">Started</span>
                      <p className="font-mono text-[13px] text-neutral-700 dark:text-neutral-300 font-medium mt-0.5 m-0">{formatDate(t.administration_date)}</p>
                    </div>
                    {hl && (
                      <div>
                        <span className="font-sans text-[10px] text-neutral-400 font-bold uppercase tracking-[0.05em]">Effectiveness</span>
                        <p className={cn('font-sans text-[13px] font-extrabold mt-0.5 m-0', hl.color)}>{hl.emoji} {hl.l}</p>
                      </div>
                    )}
                  </div>

                  {t.worsened_pans && (
                    <div className="bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 rounded-lg py-1.5 px-2.5 mb-2 flex gap-1.5 items-center">
                      <span className="text-[14px]">⚠️</span>
                      <span className="font-sans font-extrabold text-[12px] text-danger-600 dark:text-danger-400">Worsened PANS/PANDAS symptoms</span>
                    </div>
                  )}

                  {t.side_effects && t.side_effects.length > 0 && (
                    <div className="mb-2">
                      <p className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-[0.05em] mb-1.5">Side Effects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.side_effects.map((se) => {
                          const isWarn = isWarningSideEffect(se);
                          return (
                            <span key={se} className={cn(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                              isWarn
                                ? 'bg-danger-50 text-danger-500 border-danger-200'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                            )}>
                              {isWarn ? '⚠️ ' : ''}{se}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {t.fail_reason && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-danger-100 dark:border-danger-800 rounded-lg p-2 px-2.5 mb-1.5">
                      <p className="font-sans text-[10px] font-bold text-danger-400 uppercase tracking-[0.05em] mb-0.5">Why it failed</p>
                      <p className="font-sans text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed m-0 italic">{t.fail_reason}</p>
                    </div>
                  )}

                  {t.improvement_notes && (
                    <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed italic m-0">📝 {t.improvement_notes}</p>
                  )}

                  <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-neutral-50 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setEditIdx(i);
                        setTType(t.treatment_type); setTName(t.medication_name); setTDose(t.dosage || '');
                        setTStartDate(t.administration_date); setTEndDate(t.end_date || '');
                        setTStatus(t.status || 'active'); setTHelpRating(t.help_rating ?? null);
                        setTWorsenedPans(t.worsened_pans || false); setTSideEffects(t.side_effects || []);
                        setTFailReason(t.fail_reason || ''); setTNote(t.improvement_notes || '');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-primary-50 border border-primary-200 font-sans font-extrabold text-[11px] text-primary-600 cursor-pointer flex items-center justify-center gap-1 dark:bg-primary-950/30 dark:border-primary-700 dark:text-primary-400"
                    >
                      ✏️ Edit Entry
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="py-1.5 px-3 rounded-lg bg-danger-50 border border-danger-200 font-sans font-extrabold text-[11px] text-danger-500 cursor-pointer flex items-center gap-1 dark:bg-danger-950/30 dark:border-danger-700 dark:text-danger-400"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TreatmentTracker;
