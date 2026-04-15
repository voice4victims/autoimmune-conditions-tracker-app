
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChildProfile, SymptomRating } from '@/types/pandas';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

interface Treatment {
  id: string;
  treatment_type: string;
  medication_name: string;
  dosage: string;
  administration_date: string;
  administration_time?: string;
  symptoms_improved?: boolean;
  improvement_notes?: string;
  status?: 'active' | 'discontinued' | 'failed';
  help_rating?: number | null;
  worsened_pans?: boolean;
  side_effects?: string[];
  fail_reason?: string;
  end_date?: string;
  created_at: string | Timestamp;
}

interface Note {
  id: string;
  note: string;
  date: string;
  created_at: string | Timestamp;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  childProfile: ChildProfile | null;
  setChildProfile: (profile: ChildProfile | null) => void;
  children: ChildProfile[];
  treatments: Treatment[];
  symptoms: SymptomRating[];
  notes: Note[];
  customSymptoms: string[];
  addSymptom: (symptom: SymptomRating) => Promise<void>;
  addTreatment: (treatment: any) => Promise<void>;
  deleteTreatment: (treatmentId: string) => Promise<void>;
  addNote: (note: Pick<Note, 'note' | 'date'>) => Promise<void>;
  addCustomSymptom: (symptom: string) => void;
  loadChildren: () => Promise<void>;
  loadTreatments: () => Promise<void>;
  loadSymptoms: () => Promise<void>;
  loadNotes: () => Promise<void>;
  saveChildProfile: (profile: Partial<ChildProfile>) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  childrenLoading: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRating[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const addCustomSymptom = (symptom: string) => {
    if (!customSymptoms.includes(symptom)) {
      setCustomSymptoms((prev) => [...prev, symptom]);
    }
  };

  const loadChildren = async () => {
    if (!user) {
      setChildrenLoading(false);
      return;
    }
    setChildrenLoading(true);
    try {
      const q = query(collection(db, 'children'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const loadedChildren = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ChildProfile)
      );
      setChildrenList(loadedChildren);
      if (loadedChildren.length > 0 && !childProfile) {
        setChildProfile(loadedChildren[0]);
      } else if (loadedChildren.length === 0) {
        setChildProfile(null);
      }
    } catch (err) {
      console.error('[loadChildren] Firestore query failed:', err);
    } finally {
      setChildrenLoading(false);
    }
  };

  const saveChildProfile = async (profile: Partial<ChildProfile>) => {
    if (!user) return;
    const cleanProfile = Object.fromEntries(
      Object.entries(profile).filter(([_, v]) => v !== undefined)
    );
    if (profile.id) {
      const childRef = doc(db, 'children', profile.id);
      await updateDoc(childRef, cleanProfile);
    } else {
      await addDoc(collection(db, 'children'), {
        ...cleanProfile,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    }
    await loadChildren();
  };

  const deleteChild = async (childId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'children', childId));
    await loadChildren();
    const remainingChildren = childrenList.filter((child) => child.id !== childId);
    if (childProfile?.id === childId) {
        setChildProfile(remainingChildren.length > 0 ? remainingChildren[0] : null);
    }
  };

  const addSymptom = async (symptom: SymptomRating) => {
    if (!childProfile || !childProfile.id) return;
    await addDoc(collection(db, 'children', childProfile.id, 'symptoms'), {
      ...symptom,
      createdAt: serverTimestamp(),
    });
    await loadSymptoms();
  };

  const loadSymptoms = async () => {
    if (!childProfile || !childProfile.id) {
      setSymptoms([]);
      return;
    }
    const q = query(collection(db, 'children', childProfile.id, 'symptoms'));
    const querySnapshot = await getDocs(q);
    const loadedSymptoms = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SymptomRating)
    );
    loadedSymptoms.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    setSymptoms(loadedSymptoms);
  };

  const loadTreatments = async () => {
    if (!childProfile || !childProfile.id) {
        setTreatments([]);
        return;
    };
    const q = query(collection(db, 'children', childProfile.id, 'treatments'));
    const querySnapshot = await getDocs(q);
    const loadedTreatments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Treatment));
    loadedTreatments.sort((a, b) => (b.administration_date || '').localeCompare(a.administration_date || ''));
    setTreatments(loadedTreatments);
  };

  const addTreatment = async (treatment: any) => {
    if (!childProfile || !childProfile.id) return;
    const newTreatment = {
      ...treatment,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'children', childProfile.id, 'treatments'), newTreatment);
    await loadTreatments();
  };

  const deleteTreatment = async (treatmentId: string) => {
    if (!childProfile || !childProfile.id) return;
    await deleteDoc(doc(db, 'children', childProfile.id, 'treatments', treatmentId));
    await loadTreatments();
  };

  const loadNotes = async () => {
    if (!childProfile || !childProfile.id) {
      setNotes([]);
      return;
    }
    const q = query(collection(db, 'children', childProfile.id, 'notes'));
    const querySnapshot = await getDocs(q);
    const loadedNotes = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Note)
    );
    loadedNotes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    setNotes(loadedNotes);
  };

  const addNote = async (note: Pick<Note, 'note' | 'date'>) => {
    if (!childProfile || !childProfile.id) return;
    await addDoc(collection(db, 'children', childProfile.id, 'notes'), {
      ...note,
      createdAt: serverTimestamp(),
    });
    await loadNotes();
  };

  useEffect(() => {
    if (user) {
      loadChildren();
    }
  }, [user]);

  useEffect(() => {
    if (childProfile) {
      loadTreatments();
      loadSymptoms();
      loadNotes();
    } else {
      setTreatments([]);
      setSymptoms([]);
      setNotes([]);
    }
  }, [childProfile]);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        childProfile,
        setChildProfile,
        children: childrenList,
        treatments,
        symptoms,
        notes,
        customSymptoms,
        addSymptom,
        addTreatment,
        deleteTreatment,
        addNote,
        addCustomSymptom,
        loadChildren,
        loadTreatments,
        loadSymptoms,
        loadNotes,
        childrenLoading,
        saveChildProfile,
        deleteChild,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
