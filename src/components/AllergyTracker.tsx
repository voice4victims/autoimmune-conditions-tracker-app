import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

interface AllergyCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  commonTriggers: string[];
  commonSymptoms: string[];
}

const ALLERGY_CATEGORIES: AllergyCategory[] = [
  {
    id: 'respiratory',
    label: 'Respiratory / Seasonal',
    icon: '\u{1F33F}',
    color: '#2E8B57',
    description: 'Airborne allergens that affect breathing and sinuses',
    commonTriggers: ['Pollen', 'Dust mites', 'Mold', 'Animal dander'],
    commonSymptoms: ['Sneezing', 'Runny nose', 'Congestion', 'Wheezing'],
  },
  {
    id: 'food',
    label: 'Food Allergies',
    icon: '\u{1F95C}',
    color: '#C05020',
    description: 'Immune reactions to specific foods (Big 9 allergens)',
    commonTriggers: ['Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat', 'Sesame'],
    commonSymptoms: ['Hives', 'Swelling', 'GI distress', 'Anaphylaxis'],
  },
  {
    id: 'skin',
    label: 'Skin Allergies',
    icon: '\u{1F590}\u{FE0F}',
    color: '#8B4513',
    description: 'Contact dermatitis and skin-related allergic reactions',
    commonTriggers: ['Nickel', 'Latex', 'Poison ivy', 'Fragrances'],
    commonSymptoms: ['Rash', 'Itching', 'Blistering', 'Dry skin'],
  },
  {
    id: 'pet',
    label: 'Pet Allergies',
    icon: '\u{1F43E}',
    color: '#7050A0',
    description: 'Reactions to animal proteins in dander, saliva, or urine',
    commonTriggers: ['Cat dander', 'Dog dander', 'Rodents', 'Birds'],
    commonSymptoms: ['Sneezing', 'Itchy eyes', 'Hives', 'Asthma flare'],
  },
  {
    id: 'insect',
    label: 'Insect Sting / Bite',
    icon: '\u{1F41D}',
    color: '#D4A000',
    description: 'Allergic reactions to insect venom or saliva',
    commonTriggers: ['Bee', 'Wasp', 'Fire ant', 'Mosquito'],
    commonSymptoms: ['Swelling', 'Pain', 'Hives', 'Anaphylaxis'],
  },
  {
    id: 'drug',
    label: 'Drug / Medication',
    icon: '\u{1F48A}',
    color: '#C02040',
    description: 'Adverse immune responses to medications',
    commonTriggers: ['Penicillin', 'Sulfa drugs', 'NSAIDs', 'Anticonvulsants'],
    commonSymptoms: ['Rash', 'Fever', 'Swelling', 'Anaphylaxis'],
  },
  {
    id: 'eye',
    label: 'Eye Allergies',
    icon: '\u{1F441}\u{FE0F}',
    color: '#1060A0',
    description: 'Allergic conjunctivitis and ocular irritation',
    commonTriggers: ['Pollen', 'Dust', 'Pet dander', 'Contact lens solutions'],
    commonSymptoms: ['Itchy eyes', 'Redness', 'Tearing', 'Swollen eyelids'],
  },
];

interface SeverityLevel {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const SEVERITY_LEVELS: SeverityLevel[] = [
  { id: 'unknown', label: 'Unknown', emoji: '\u{2753}', color: '#888888' },
  { id: 'mild', label: 'Mild', emoji: '\u{1F7E1}', color: '#C09000' },
  { id: 'moderate', label: 'Moderate', emoji: '\u{1F7E0}', color: '#C06020' },
  { id: 'severe', label: 'Severe', emoji: '\u{1F534}', color: '#C02020' },
  { id: 'anaphylaxis', label: 'Anaphylaxis', emoji: '\u{1F6A8}', color: '#900000' },
];

interface AllergyRecord {
  id: string;
  category: string;
  trigger: string;
  severity: string;
  reaction: string;
  date: string;
  confirmed: boolean;
  notes: string;
  user_id: string;
  child_id: string;
  created_at: string;
}

const SAMPLE_RECORDS: Omit<AllergyRecord, 'id' | 'user_id' | 'child_id' | 'created_at'>[] = [
  {
    category: 'drug',
    trigger: 'Azithromycin',
    severity: 'moderate',
    reaction: 'Rash and GI upset after 3 days of treatment',
    date: '2025-11-15',
    confirmed: true,
    notes: 'Confirmed by allergist. Switched to alternative antibiotic.',
  },
  {
    category: 'food',
    trigger: 'Gluten / Wheat',
    severity: 'mild',
    reaction: 'Bloating and fatigue after wheat-containing meals',
    date: '2025-09-20',
    confirmed: false,
    notes: 'Noticed correlation with symptom flares. Testing elimination diet.',
  },
  {
    category: 'drug',
    trigger: 'Penicillin',
    severity: 'unknown',
    reaction: 'Family history of penicillin allergy, not yet tested',
    date: '2025-08-01',
    confirmed: false,
    notes: 'Avoiding penicillin-class antibiotics as precaution.',
  },
];

type TabId = 'overview' | 'records' | 'form';

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

const AllergyTracker: React.FC = () => {
  const { user } = useAuth();
  const { childProfile } = useApp();
  const { toast } = useToast();

  const [records, setRecords] = useState<AllergyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fCategory, setFCategory] = useState('respiratory');
  const [fTrigger, setFTrigger] = useState('');
  const [fSeverity, setFSeverity] = useState('unknown');
  const [fReaction, setFReaction] = useState('');
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fConfirmed, setFConfirmed] = useState(false);
  const [fNotes, setFNotes] = useState('');

  useEffect(() => {
    if (childProfile && user) fetchRecords();
  }, [childProfile, user]);

  const fetchRecords = async () => {
    if (!user?.uid || !childProfile?.id) return;
    try {
      const q = query(
        collection(db, 'allergy_records'),
        where('user_id', '==', user.uid),
        where('child_id', '==', childProfile.id)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AllergyRecord[];
      results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      if (results.length === 0) {
        await seedSampleRecords();
      } else {
        setRecords(results);
      }
    } catch {
      if (records.length === 0) {
        await seedSampleRecords();
      }
    }
  };

  const seedSampleRecords = async () => {
    if (!user?.uid || !childProfile?.id) return;
    const seeded: AllergyRecord[] = [];
    for (const sample of SAMPLE_RECORDS) {
      const data = {
        ...sample,
        user_id: user.uid,
        child_id: childProfile.id,
        created_at: new Date().toISOString(),
      };
      try {
        const docRef = await addDoc(collection(db, 'allergy_records'), {
          ...data,
          created_at: Timestamp.now(),
        });
        seeded.push({ ...data, id: docRef.id });
      } catch {
        seeded.push({ ...data, id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}` });
      }
    }
    setRecords(seeded);
  };

  const resetForm = () => {
    setFCategory('respiratory');
    setFTrigger('');
    setFSeverity('unknown');
    setFReaction('');
    setFDate(new Date().toISOString().split('T')[0]);
    setFConfirmed(false);
    setFNotes('');
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!fTrigger || !user?.uid || !childProfile?.id) return;
    try {
      setLoading(true);
      const data = {
        category: fCategory,
        trigger: fTrigger,
        severity: fSeverity,
        reaction: fReaction,
        date: fDate,
        confirmed: fConfirmed,
        notes: fNotes,
        user_id: user.uid,
        child_id: childProfile.id,
      };

      if (editingId) {
        const ref = doc(db, 'allergy_records', editingId);
        await updateDoc(ref, data);
        setRecords((prev) =>
          prev.map((r) =>
            r.id === editingId ? { ...r, ...data } : r
          )
        );
      } else {
        const docRef = await addDoc(collection(db, 'allergy_records'), {
          ...data,
          created_at: Timestamp.now(),
        });
        setRecords((prev) => [
          { ...data, id: docRef.id, created_at: new Date().toISOString() },
          ...prev,
        ]);
      }

      resetForm();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setActiveTab('records');
    } catch {
      toast({ title: 'Error', description: 'Failed to save allergy record', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'allergy_records', id));
    } catch {}
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Deleted', description: 'Allergy record removed' });
  };

  const startEdit = (record: AllergyRecord) => {
    setEditingId(record.id);
    setFCategory(record.category);
    setFTrigger(record.trigger);
    setFSeverity(record.severity);
    setFReaction(record.reaction);
    setFDate(record.date);
    setFConfirmed(record.confirmed);
    setFNotes(record.notes);
    setActiveTab('form');
  };

  const getCategoryById = (id: string) => ALLERGY_CATEGORIES.find((c) => c.id === id);
  const getSeverityById = (id: string) => SEVERITY_LEVELS.find((s) => s.id === id);
  const countByCategory = (catId: string) => records.filter((r) => r.category === catId).length;

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">{'\u{1F33F}'}</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Please select a child to track allergies</p>
        </CardContent>
      </Card>
    );
  }

  const renderTabs = () => (
    <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-4">
      {([
        ['overview', 'Overview'],
        ['records', 'Records'],
        ['form', editingId ? 'Edit' : 'Add New'],
      ] as [TabId, string][]).map(([id, label]) => (
        <button
          key={id}
          onClick={() => {
            setActiveTab(id);
            if (id === 'form' && !editingId) resetForm();
          }}
          className={cn(
            'flex-1 py-2 rounded-lg font-sans font-bold text-[12px] cursor-pointer transition-all border-none',
            activeTab === id
              ? 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow-sm'
              : 'bg-transparent text-neutral-400'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-3">
      <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/30">
        <CardContent className="p-3.5">
          <div className="flex gap-2 items-start">
            <span className="text-lg shrink-0">{'\u{1F9EC}'}</span>
            <div>
              <p className="font-sans font-extrabold text-[12px] text-primary-700 dark:text-primary-300 mb-1">
                PANDAS/PANS & Allergies
              </p>
              <p className="font-sans text-[11px] text-primary-600/80 dark:text-primary-400/80 leading-relaxed m-0">
                Many children with PANDAS/PANS have co-occurring allergic conditions. Tracking allergies alongside neuropsychiatric symptoms can help identify immune triggers and guide treatment decisions. Mast cell activation and immune dysregulation are commonly observed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {ALLERGY_CATEGORIES.map((cat) => {
        const count = countByCategory(cat.id);
        const isExpanded = expandedCategory === cat.id;
        const catRecords = records.filter((r) => r.category === cat.id);

        return (
          <Card key={cat.id} className="overflow-hidden">
            <CardContent className="p-0">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                className="w-full flex items-start gap-3 p-3.5 text-left cursor-pointer bg-transparent border-none"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${cat.color}18` }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100">
                      {cat.label}
                    </span>
                    {count > 0 && (
                      <Badge
                        className="text-[10px] py-0 px-2 border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                          borderColor: `${cat.color}40`,
                        }}
                      >
                        {count}
                      </Badge>
                    )}
                  </div>
                  <p className="font-sans text-[11px] text-neutral-400 m-0 mb-1">{cat.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {cat.commonTriggers.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="font-sans text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-full px-2 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                      setFCategory(cat.id);
                      setActiveTab('form');
                    }}
                    className="font-sans font-bold text-[11px] bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 cursor-pointer text-neutral-500 dark:text-neutral-400"
                  >
                    + Add
                  </button>
                  <span
                    className={cn(
                      'text-neutral-400 text-sm transition-transform',
                      isExpanded ? 'rotate-90' : ''
                    )}
                  >
                    {'\u{203A}'}
                  </span>
                </div>
              </button>

              {isExpanded && catRecords.length > 0 && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-3.5 pb-3">
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {catRecords.map((rec) => {
                      const sev = getSeverityById(rec.severity);
                      return (
                        <div key={rec.id} className="py-2.5 first:pt-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-sans font-extrabold text-[12px] text-neutral-700 dark:text-neutral-200">
                              {rec.trigger}
                            </span>
                            {sev && (
                              <span
                                className="font-sans font-bold text-[10px] rounded-full px-2 py-0.5"
                                style={{
                                  backgroundColor: `${sev.color}15`,
                                  color: sev.color,
                                }}
                              >
                                {sev.emoji} {sev.label}
                              </span>
                            )}
                            {rec.confirmed && (
                              <Badge className="text-[9px] py-0 px-1.5 bg-success-50 text-success-600 border border-success-200">
                                {'\u{2705}'} Confirmed
                              </Badge>
                            )}
                          </div>
                          {rec.reaction && (
                            <p className="font-sans text-[11px] text-neutral-400 m-0">{rec.reaction}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isExpanded && catRecords.length === 0 && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 px-3.5 py-4 text-center">
                  <p className="font-sans text-[11px] text-neutral-400 m-0">
                    No allergies recorded in this category
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-3">
      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-3xl mb-3">{'\u{1F33F}'}</p>
            <p className="font-sans font-extrabold text-[13px] text-neutral-500 dark:text-neutral-400 mb-1">
              No allergy records yet
            </p>
            <p className="font-sans text-[11px] text-neutral-400 mb-3">
              Add your first allergy record to start tracking
            </p>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setActiveTab('form');
              }}
            >
              + Add Allergy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-3">
              All Allergy Records ({records.length})
            </p>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {records.map((rec) => {
                const cat = getCategoryById(rec.category);
                const sev = getSeverityById(rec.severity);
                return (
                  <div key={rec.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {cat && <span className="text-sm">{cat.icon}</span>}
                          <span className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100">
                            {rec.trigger}
                          </span>
                          {sev && (
                            <span
                              className="font-sans font-bold text-[10px] rounded-full px-2 py-0.5"
                              style={{
                                backgroundColor: `${sev.color}15`,
                                color: sev.color,
                              }}
                            >
                              {sev.emoji} {sev.label}
                            </span>
                          )}
                          {rec.confirmed && (
                            <Badge className="text-[9px] py-0 px-1.5 bg-success-50 text-success-600 border border-success-200">
                              {'\u{2705}'} Confirmed
                            </Badge>
                          )}
                        </div>
                        <p className="font-sans text-[11px] text-neutral-400 mt-0.5">
                          {cat?.label || rec.category} {'\u{00B7}'} {rec.date}
                        </p>
                        {rec.reaction && (
                          <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                            {rec.reaction}
                          </p>
                        )}
                        {rec.notes && (
                          <p className="font-sans text-[11px] text-neutral-400 mt-1 italic">
                            {rec.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => startEdit(rec)}
                          className="text-[11px] text-primary-500 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
                        >
                          {'\u{270F}\u{FE0F}'}
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="text-[11px] text-danger-500 bg-danger-50 border border-danger-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
                        >
                          {'\u{1F5D1}\u{FE0F}'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderForm = () => {
    const selectedCategory = getCategoryById(fCategory);

    return (
      <Card className={editingId ? 'border-2 border-warning-400' : ''}>
        <CardContent className="p-4 space-y-3.5">
          {editingId && (
            <div className="flex justify-between items-center bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
              <span className="font-sans font-extrabold text-[12px] text-warning-600">
                {'\u{270F}\u{FE0F}'} Editing allergy record
              </span>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('records');
                }}
                className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 bg-transparent border-none cursor-pointer"
              >
                {'\u{2715}'} Cancel
              </button>
            </div>
          )}

          <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">
            {editingId ? 'Edit Allergy Record' : 'Log Allergy'}
          </h3>

          <FieldWrap label="Category">
            <Select value={fCategory} onValueChange={setFCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLERGY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>

          {selectedCategory && (
            <div className="flex flex-wrap gap-1">
              {selectedCategory.commonTriggers.map((t) => (
                <button
                  key={t}
                  onClick={() => setFTrigger(t)}
                  className={cn(
                    'font-sans text-[11px] font-bold rounded-full px-2.5 py-1 cursor-pointer transition-all border-[1.5px]',
                    fTrigger === t
                      ? 'border-primary-400 bg-primary-50 text-primary-600'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 bg-transparent'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <FieldWrap label="Trigger / Allergen">
            <Input
              value={fTrigger}
              onChange={(e) => setFTrigger(e.target.value)}
              placeholder="e.g. Peanuts, Penicillin, Dust mites"
            />
          </FieldWrap>

          <FieldWrap label="Severity">
            <div className="flex gap-1.5 flex-wrap">
              {SEVERITY_LEVELS.map((sev) => (
                <button
                  key={sev.id}
                  onClick={() => setFSeverity(sev.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-[1.5px] font-sans font-bold text-[11px] cursor-pointer transition-all',
                    fSeverity === sev.id
                      ? 'bg-opacity-10'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-400'
                  )}
                  style={
                    fSeverity === sev.id
                      ? {
                          borderColor: sev.color,
                          backgroundColor: `${sev.color}15`,
                          color: sev.color,
                        }
                      : undefined
                  }
                >
                  {sev.emoji} {sev.label}
                </button>
              ))}
            </div>
          </FieldWrap>

          <FieldWrap label="Reaction Description">
            <Input
              value={fReaction}
              onChange={(e) => setFReaction(e.target.value)}
              placeholder="e.g. Hives on arms, throat tightness"
            />
          </FieldWrap>

          <FieldWrap label="Date First Observed">
            <Input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
          </FieldWrap>

          <div>
            <button
              onClick={() => setFConfirmed((v) => !v)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg border-[1.5px] font-sans font-bold text-[12px] cursor-pointer transition-all',
                fConfirmed
                  ? 'border-success-400 bg-success-50 text-success-600'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-400'
              )}
            >
              {fConfirmed ? '\u{2705}' : '\u{2B1C}'} Confirmed by allergist
            </button>
          </div>

          <FieldWrap label="Notes">
            <Textarea
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
              placeholder="Additional observations, test results, cross-reactivity..."
              className="min-h-[68px] resize-none"
            />
          </FieldWrap>

          {saved ? (
            <div className="p-3.5 bg-success-50 rounded-xl border border-success-100 text-center">
              <span className="font-sans font-extrabold text-[14px] text-success-600">
                {'\u{2713}'} Allergy record saved
              </span>
            </div>
          ) : (
            <Button className="w-full" onClick={handleSave} disabled={loading || !fTrigger}>
              {loading ? 'Saving...' : editingId ? 'Update Record' : 'Save Allergy Record'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderTabs()}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'records' && renderRecords()}
      {activeTab === 'form' && renderForm()}
    </div>
  );
};

export default AllergyTracker;
