import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ActivityForm from './ActivityForm';

interface Activity {
  id: string;
  activity_name: string;
  activity_type: 'screen_time' | 'outdoor' | 'indoor';
  duration_minutes: number;
  date: string;
  notes?: string;
  created_at: any;
}

const ActivityTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childProfile) fetchActivities();
  }, [childProfile]);

  const fetchActivities = async () => {
    if (!childProfile || !user) return;
    try {
      const activitiesRef = collection(db, 'activity_logs');
      const q = query(activitiesRef, where('userId', '==', user.uid), where('child_id', '==', childProfile.id));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Activity[];
      data.sort((a, b) => (b.date || '').localeCompare(a.date || '') || String(b.created_at || '').localeCompare(String(a.created_at || '')));
      setActivities(data);
    } catch (error) {
      const key = `pandas-activities-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      setActivities(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (activityData: {
    activity_name: string;
    activity_type: 'screen_time' | 'outdoor' | 'indoor';
    duration_minutes: number;
    date: string;
    notes?: string;
  }) => {
    if (!childProfile || !user) return;
    const newActivityData = { child_id: childProfile.id, userId: user.uid, ...activityData, created_at: serverTimestamp() };
    try {
      const docRef = await addDoc(collection(db, 'activity_logs'), newActivityData);
      setActivities(prev => [{ ...newActivityData, id: docRef.id, created_at: new Date() }, ...prev]);
    } catch (error) {
      const newActivity = { id: Date.now().toString(), child_id: childProfile.id, created_at: new Date().toISOString(), ...activityData };
      setActivities(prev => [newActivity, ...prev]);
      const key = `pandas-activities-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newActivity);
      localStorage.setItem(key, JSON.stringify(list));
    }
  };

  const handleDelete = async (activityId: string) => {
    try { await deleteDoc(doc(db, 'activity_logs', activityId)); } catch (error) {}
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== activityId);
      if (childProfile) localStorage.setItem(`pandas-activities-${childProfile.id}`, JSON.stringify(updated));
      return updated;
    });
    toast({ title: 'Deleted', description: 'Activity removed' });
  };

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const typeLabel = (t: string) => t === 'screen_time' ? 'Screen Time' : t === 'outdoor' ? 'Outdoor' : 'Indoor';

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">🏃</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Please select a child to track activities</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ActivityForm onSubmit={handleAddActivity} />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </CardContent>
        </Card>
      ) : activities.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-3">
              Activity History
            </p>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {activities.map((a) => (
                <div key={a.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100">{a.activity_name}</span>
                      <span className="font-sans font-bold text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-200">
                        {typeLabel(a.activity_type)}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-neutral-400 mt-0.5">
                      {formatDuration(a.duration_minutes)} · {a.date}
                    </p>
                    {a.notes && <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 italic">{a.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
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

export default ActivityTracker;
