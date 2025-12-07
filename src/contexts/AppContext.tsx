import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChildProfile, SymptomRating } from '@/types/pandas';
import { useAuth } from './AuthContext';

interface Treatment {
  id: string;
  treatment_type: string;
  medication_name: string;
  dosage: string;
  administration_date: string;
  administration_time: string;
  symptoms_improved: boolean;
  improvement_notes?: string;
  created_at: string;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  childProfile: ChildProfile | null;
  setChildProfile: (profile: ChildProfile | null) => void;
  children: ChildProfile[];
  treatments: Treatment[];
  customSymptoms: string[];
  addSymptom: (symptom: SymptomRating) => Promise<void>;
  addTreatment: (treatment: any) => Promise<void>;
  addCustomSymptom: (symptom: string) => void;
  loadChildren: () => Promise<void>;
  loadTreatments: () => Promise<void>;
  saveChildProfile: (profile: ChildProfile) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const addCustomSymptom = (symptom: string) => {
    if (!customSymptoms.includes(symptom)) {
      setCustomSymptoms(prev => [...prev, symptom]);
    }
  };

  const loadChildren = async () => {
    const stored = localStorage.getItem('pandas-children');
    if (stored) {
      const localChildren = JSON.parse(stored);
      setChildrenList(localChildren);
      if (localChildren.length > 0 && !childProfile) {
        setChildProfile(localChildren[0]);
      }
    } else {
      const defaultChild: ChildProfile = {
        id: 'local-child-' + Date.now(),
        name: 'My Child',
        dateOfBirth: '2015-01-01',
        age: 9,
        diagnosisDate: '2023-01-01',
        notes: '',
        photoUrl: null,
        symptoms: []
      };
      setChildrenList([defaultChild]);
      setChildProfile(defaultChild);
      localStorage.setItem('pandas-children', JSON.stringify([defaultChild]));
    }
  };

  const saveChildProfile = async (profile: ChildProfile) => {
    setChildrenList(prev => {
      const updated = prev.map(child => child.id === profile.id ? profile : child);
      if (!updated.find(c => c.id === profile.id)) {
        updated.push(profile);
      }
      localStorage.setItem('pandas-children', JSON.stringify(updated));
      return updated;
    });
    if (childProfile?.id === profile.id) {
      setChildProfile(profile);
    }
  };

  const addSymptom = async (symptom: SymptomRating) => {
    if (!childProfile) return;
    const key = `pandas-symptoms-${childProfile.id}`;
    const stored = localStorage.getItem(key);
    const symptoms = stored ? JSON.parse(stored) : [];
    symptoms.push(symptom);
    localStorage.setItem(key, JSON.stringify(symptoms));
  };

  const addTreatment = async (treatment: any) => {
    if (!childProfile) return;
    const newTreatment = { id: Date.now().toString(), ...treatment };
    setTreatments(prev => [newTreatment, ...prev]);
    const key = `pandas-treatments-${childProfile.id}`;
    const stored = localStorage.getItem(key);
    const treatments = stored ? JSON.parse(stored) : [];
    treatments.push(newTreatment);
    localStorage.setItem(key, JSON.stringify(treatments));
  };

  const loadTreatments = async () => {
    if (!childProfile) return;
    const key = `pandas-treatments-${childProfile.id}`;
    const stored = localStorage.getItem(key);
    setTreatments(stored ? JSON.parse(stored) : []);
  };

  const deleteChild = async (childId: string) => {
    setChildrenList(prev => {
      const updated = prev.filter(child => child.id !== childId);
      localStorage.setItem('pandas-children', JSON.stringify(updated));
      return updated;
    });
    if (childProfile?.id === childId) {
      const remainingChildren = childrenList.filter(child => child.id !== childId);
      setChildProfile(remainingChildren.length > 0 ? remainingChildren[0] : null);
    }
  };

  useEffect(() => {
    if (user) loadChildren();
  }, [user]);

  useEffect(() => {
    if (childProfile) loadTreatments();
  }, [childProfile]);

  return (
    <AppContext.Provider value={{
      sidebarOpen, toggleSidebar, childProfile, setChildProfile, children: childrenList,
      treatments, customSymptoms, addSymptom, addTreatment, addCustomSymptom,
      loadChildren, loadTreatments, saveChildProfile, deleteChild
    }}>
      {children}
    </AppContext.Provider>
  );
};