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