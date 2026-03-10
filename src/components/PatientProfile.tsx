import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Save, User, Stethoscope, Clock } from 'lucide-react';

const GENDER_OPTIONS = ['Male', 'Female'];

const INFECTION_TYPES = [
  'Streptococcal (Group A Strep / PANDAS)',
  'Streptococcal (PANS — suspected)',
  'Lyme Disease',
  'Mono',
  'EBV',
  'Influenza',
  'COVID-19',
  'Mycoplasma pneumoniae',
  'HHV-6',
  'HSV',
  'Other Bacterial',
  'Other Viral',
  'Unknown',
];

const SUBTYPE_OPTIONS = ['PANDAS', 'PANS', 'Unknown'];

const COMORBIDITY_CONDITIONS = [
  'Asthma',
  'Autoimmune disorder',
  'Cancer',
  'CKD',
  'Chronic Liver Disease',
  'COPD',
  'Diabetes',
  'Dysautonomia',
  'EDS',
  'Endometriosis',
  'Fibromyalgia',
  'Gastroparesis',
  'Heart Disease',
  'Herpesvirus',
  'Hypertension',
  'HIV+',
  'Immunocompromised',
  'IBS',
  'MCAS',
  'Migraine',
  'ME/CFS',
  'Other Chronic Lung Disease',
  'PCOS',
  'POTS',
  'Sleep apnea',
  'Tic disorder/Tourette',
  'pre-existing OCD',
  'pre-existing ADHD',
  'pre-existing Anxiety',
  'Other',
];

interface PatientProfileData {
  firstName: string;
  dateOfBirth: string;
  gender: string;
  acuteInfectionType: string;
  acuteInfectionDate: string;
  diagnosisDate: string;
  diagnosingProvider: string;
  currentPhysician: string;
  subtype: string;
}

interface ComorbidityData {
  priorToInfection: string[];
  postInfection: string[];
  priorOtherText: string;
  postOtherText: string;
}

const FieldWrap: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em]">
      {label}
    </label>
    {children}
  </div>
);

const PatientProfile: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<PatientProfileData>({
    firstName: '',
    dateOfBirth: '',
    gender: '',
    acuteInfectionType: '',
    acuteInfectionDate: '',
    diagnosisDate: '',
    diagnosingProvider: '',
    currentPhysician: '',
    subtype: '',
  });

  const [comorbidities, setComorbidities] = useState<ComorbidityData>({
    priorToInfection: [],
    postInfection: [],
    priorOtherText: '',
    postOtherText: '',
  });

  const docId = useMemo(() => {
    if (!user?.uid || !childProfile?.id) return null;
    return `${user.uid}_${childProfile.id}`;
  }, [user?.uid, childProfile?.id]);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [docId]);

  const loadData = async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'patient_profiles', docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          firstName: data.firstName || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          acuteInfectionType: data.acuteInfectionType || '',
          acuteInfectionDate: data.acuteInfectionDate || '',
          diagnosisDate: data.diagnosisDate || '',
          diagnosingProvider: data.diagnosingProvider || '',
          currentPhysician: data.currentPhysician || '',
          subtype: data.subtype || '',
        });
        setComorbidities({
          priorToInfection: data.comorbidities?.priorToInfection || [],
          postInfection: data.comorbidities?.postInfection || [],
          priorOtherText: data.comorbidities?.priorOtherText || '',
          postOtherText: data.comorbidities?.postOtherText || '',
        });
      } else if (childProfile) {
        setProfile((prev) => ({
          ...prev,
          firstName: childProfile.name || '',
          dateOfBirth: childProfile.dateOfBirth || '',
          diagnosisDate: childProfile.diagnosisDate || '',
        }));
      }
    } catch (err) {
      console.error('Error loading patient profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!docId || !user?.uid || !childProfile?.id) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'patient_profiles', docId);
      await setDoc(
        docRef,
        {
          ...profile,
          comorbidities,
          userId: user.uid,
          childId: childProfile.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      toast({ title: 'Saved', description: 'Patient profile updated successfully.' });
    } catch (err) {
      console.error('Error saving patient profile:', err);
      toast({ title: 'Error', description: 'Failed to save profile. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof PatientProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleComorbidity = (column: 'priorToInfection' | 'postInfection', condition: string) => {
    setComorbidities((prev) => {
      const list = prev[column];
      const updated = list.includes(condition)
        ? list.filter((c) => c !== condition)
        : [...list, condition];
      return { ...prev, [column]: updated };
    });
  };

  const symptomDuration = useMemo(() => {
    if (!profile.acuteInfectionDate) return null;
    const start = new Date(profile.acuteInfectionDate);
    const now = new Date();
    if (isNaN(start.getTime()) || start > now) return null;
    const totalMonths =
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (parts.length === 0) {
      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    return parts.join(', ');
  }, [profile.acuteInfectionDate]);

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <User className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p className="font-serif text-lg text-neutral-600 dark:text-neutral-300">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400 dark:text-neutral-500 mt-1">
            Please select a child profile to manage patient information.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-sans text-[13px] text-neutral-400">Loading patient profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">
              Patient Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldWrap label="First Name">
              <Input
                value={profile.firstName}
                onChange={(e) => updateProfile('firstName', e.target.value)}
                placeholder="Enter first name"
              />
            </FieldWrap>

            <FieldWrap label="Date of Birth">
              <Input
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
              />
            </FieldWrap>

            <FieldWrap label="Gender">
              <Select value={profile.gender} onValueChange={(v) => updateProfile('gender', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>

            <FieldWrap label="PANDAS/PANS Subtype">
              <Select value={profile.subtype} onValueChange={(v) => updateProfile('subtype', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  {SUBTYPE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>
          </div>

          <Separator />

          <FieldWrap label="Acute Infection Type">
            <Select
              value={profile.acuteInfectionType}
              onValueChange={(v) => updateProfile('acuteInfectionType', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select infection type" />
              </SelectTrigger>
              <SelectContent>
                {INFECTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWrap>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldWrap label="Acute Infection Date">
              <Input
                type="date"
                value={profile.acuteInfectionDate}
                onChange={(e) => updateProfile('acuteInfectionDate', e.target.value)}
              />
            </FieldWrap>

            <FieldWrap label="Diagnosis Date">
              <Input
                type="date"
                value={profile.diagnosisDate}
                onChange={(e) => updateProfile('diagnosisDate', e.target.value)}
              />
            </FieldWrap>
          </div>

          {symptomDuration && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800">
              <Clock className="w-4 h-4 text-primary-500 shrink-0" />
              <p className="font-sans text-[13px] text-primary-700 dark:text-primary-300 m-0">
                <span className="font-bold">Symptom Duration:</span> {symptomDuration} since acute infection
              </p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldWrap label="Diagnosing Provider">
              <Input
                value={profile.diagnosingProvider}
                onChange={(e) => updateProfile('diagnosingProvider', e.target.value)}
                placeholder="Enter provider name"
              />
            </FieldWrap>

            <FieldWrap label="Current Physician">
              <Input
                value={profile.currentPhysician}
                onChange={(e) => updateProfile('currentPhysician', e.target.value)}
                placeholder="Enter physician name"
              />
            </FieldWrap>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary-500" />
            <h3 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 m-0">
              Comorbidities
            </h3>
          </div>
          <p className="font-sans text-[13px] text-neutral-500 dark:text-neutral-400">
            Check all conditions that apply before and after infection onset.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em] mb-3">
                Prior to Infection
              </p>
              <div className="space-y-2">
                {COMORBIDITY_CONDITIONS.map((condition) => (
                  <div key={`prior-${condition}`} className="flex items-center gap-2">
                    <Checkbox
                      id={`prior-${condition}`}
                      checked={comorbidities.priorToInfection.includes(condition)}
                      onCheckedChange={() => toggleComorbidity('priorToInfection', condition)}
                    />
                    <Label
                      htmlFor={`prior-${condition}`}
                      className="font-sans text-[12px] text-neutral-700 dark:text-neutral-300 cursor-pointer leading-tight"
                    >
                      {condition}
                    </Label>
                  </div>
                ))}
                <div className="pt-1">
                  <Input
                    value={comorbidities.priorOtherText}
                    onChange={(e) =>
                      setComorbidities((prev) => ({ ...prev, priorOtherText: e.target.value }))
                    }
                    placeholder="Other: specify..."
                    className="text-[12px] h-8"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="font-sans font-extrabold text-[11px] text-neutral-400 uppercase tracking-[0.07em] mb-3">
                Post-Infection
              </p>
              <div className="space-y-2">
                {COMORBIDITY_CONDITIONS.map((condition) => (
                  <div key={`post-${condition}`} className="flex items-center gap-2">
                    <Checkbox
                      id={`post-${condition}`}
                      checked={comorbidities.postInfection.includes(condition)}
                      onCheckedChange={() => toggleComorbidity('postInfection', condition)}
                    />
                    <Label
                      htmlFor={`post-${condition}`}
                      className="font-sans text-[12px] text-neutral-700 dark:text-neutral-300 cursor-pointer leading-tight"
                    >
                      {condition}
                    </Label>
                  </div>
                ))}
                <div className="pt-1">
                  <Input
                    value={comorbidities.postOtherText}
                    onChange={(e) =>
                      setComorbidities((prev) => ({ ...prev, postOtherText: e.target.value }))
                    }
                    placeholder="Other: specify..."
                    className="text-[12px] h-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Patient Profile'}
      </Button>
    </div>
  );
};

export default PatientProfile;
