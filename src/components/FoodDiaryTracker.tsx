import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import FoodDiaryForm from './FoodDiaryForm';

interface FoodEntry {
  id: string;
  child_id: string;
  date: string;
  meal_type: string;
  food_name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  created_at: string;
}

const FoodDiaryTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  useEffect(() => {
    if (childProfile?.id) fetchEntries();
  }, [childProfile?.id]);

  const fetchEntries = async () => {
    if (!childProfile?.id || !user) return;
    try {
      setIsLoadingEntries(true);
      const entriesRef = collection(db, 'food_diary');
      const q = query(entriesRef, where('user_id', '==', user.uid), where('child_id', '==', childProfile.id), orderBy('date', 'desc'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(entriesData as FoodEntry[]);
    } catch (error) {
      const key = `pandas-food-diary-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      setEntries(stored ? JSON.parse(stored) : []);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleAddEntry = async (entryData: any) => {
    if (!childProfile?.id || !user) return;
    const newEntry = { child_id: childProfile.id, user_id: user.uid, created_at: new Date().toISOString(), ...entryData };
    try {
      setIsLoading(true);
      const docRef = await addDoc(collection(db, 'food_diary'), newEntry);
      setEntries(prev => [{ ...newEntry, id: docRef.id }, ...prev]);
    } catch (error) {
      const entryWithId = { ...newEntry, id: Date.now().toString() };
      setEntries(prev => [entryWithId, ...prev]);
      const key = `pandas-food-diary-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(entryWithId);
      localStorage.setItem(key, JSON.stringify(list));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try { await deleteDoc(doc(db, 'food_diary', entryId)); } catch (error) {}
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== entryId);
      if (childProfile) localStorage.setItem(`pandas-food-diary-${childProfile.id}`, JSON.stringify(updated));
      return updated;
    });
    toast({ title: 'Deleted', description: 'Entry removed' });
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">🍎</p>
          <p className="font-serif text-xl text-neutral-700 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Please select a child to track their food diary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <FoodDiaryForm onAddEntry={handleAddEntry} isLoading={isLoading} />

      {isLoadingEntries ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </CardContent>
        </Card>
      ) : entries.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 uppercase tracking-[0.07em] mb-3">
              Food Diary History
            </p>
            <div className="divide-y divide-neutral-100">
              {entries.map((e) => (
                <div key={e.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-extrabold text-[13px] text-neutral-800">{e.food_name}</span>
                      <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full bg-secondary-50 text-secondary-600 border border-secondary-200">
                        {e.meal_type}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-neutral-400 mt-0.5">
                      {e.date}{e.quantity ? ` · ${e.quantity}${e.unit ? ` ${e.unit}` : ''}` : ''}
                    </p>
                    {e.notes && <p className="font-sans text-[12px] text-neutral-500 mt-1 italic">{e.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-[11px] text-danger-500 bg-danger-50 border border-danger-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoodDiaryTracker;
