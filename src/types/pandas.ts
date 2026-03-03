export interface SymptomRating {
  id: string;
  symptomType: string;
  severity: number; // 0-10
  date: string;
  notes?: string;
  isImportant?: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  dateOfBirth?: string;
  age?: number;
  diagnosisDate?: string;
  notes?: string;
  photoUrl?: string;
  symptoms: SymptomRating[];
}

export interface LabResult {
  id: string;
  test: string;
  value: string;
  unit: string;
  referenceRange?: string;
  date: string;
  flag: 'normal' | 'borderline' | 'high' | 'low';
  notes?: string;
  childId: string;
}

export interface InsuranceInfo {
  provider: string;
  memberId: string;
  groupId?: string;
  planName?: string;
  phone?: string;
  copay?: string;
  deductible?: string;
  outOfPocket?: string;
  priorAuth?: string;
  notes?: string;
}

export interface CommunityProvider {
  id: string;
  name: string;
  specialty: string;
  practice?: string;
  city: string;
  state: string;
  website?: string;
  notes?: string;
  votes: number;
  added_by?: string;
  created_at?: string;
}

export interface TreatmentOutcome {
  status: 'active' | 'discontinued' | 'failed';
  helpRating?: number;
  worsenedPans?: boolean;
  sideEffects?: string[];
  failReason?: string;
  endDate?: string;
}

export const LAB_TEST_TYPES = [
  'ASO Titer',
  'Anti-DNase B',
  'Cunningham Panel - CaM Kinase II',
  'Cunningham Panel - Anti-Dopamine D1',
  'Cunningham Panel - Anti-Dopamine D2L',
  'Cunningham Panel - Anti-Lysoganglioside GM1',
  'Cunningham Panel - Anti-Tubulin',
  'CBC with Differential',
  'CRP (C-Reactive Protein)',
  'ESR (Sed Rate)',
  'ANA (Antinuclear Antibody)',
  'Mycoplasma Pneumoniae IgG',
  'Mycoplasma Pneumoniae IgM',
  'Lyme Disease Panel',
  'Thyroid Panel (TSH, T3, T4)',
  'Vitamin D (25-Hydroxy)',
  'Ferritin',
  'Immunoglobulins (IgG, IgA, IgM)',
  'Strep Culture',
  'Celiac Panel',
  'Food Allergy Panel',
  'Urinalysis',
];

export const TREATMENT_SIDE_EFFECTS = [
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Stomach pain',
  'Headache',
  'Dizziness',
  'Fatigue',
  'Insomnia',
  'Rash',
  'Appetite loss',
  'Weight gain',
  'Mood changes',
  'Increased anxiety',
  'Worsened OCD',
  'Behavioral regression',
  'Herxheimer reaction',
  'Yeast overgrowth',
];

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL',
  'GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export const PROVIDER_SPECIALTIES = [
  'Pediatric Neurologist',
  'Pediatric Immunologist',
  'Integrative Medicine',
  'Pediatric Psychiatrist',
  'Infectious Disease',
  'Naturopathic Doctor',
  'Pediatrician (PANDAS-aware)',
  'Rheumatologist',
  'Allergist/Immunologist',
  'Functional Medicine',
  'LLMD (Lyme-Literate MD)',
  'Other',
];

export const SYMPTOM_TYPES = [
  'Obsessions',
  'Compulsions', 
  'Food refusal/avoidance',
  'Anxiety (fears/phobias, separation anxiety)',
  'Mood swing/moodiness',
  'Suicidal ideation/behavior',
  'Depression/sadness',
  'Irritability',
  'Aggressive behaviors',
  'Oppositional behaviors',
  'Hyperactivity or impulsivity',
  'Trouble paying attention',
  'Behavioral regression',
  'Worsening of school performance',
  'Worsening of handwriting/copying',
  'Sleep disturbances',
  'Daytime wetting or bedwetting',
  'Urinary frequency',
  'Bothered by sounds, smells, textures, lights',
  'Hallucinations',
  'Dilated/big pupils',
  'Tics (movements)',
  'Tics (sounds)'
];