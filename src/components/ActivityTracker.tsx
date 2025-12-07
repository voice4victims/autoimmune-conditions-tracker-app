import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import { Clock, BarChart3 } from 'lucide-react';

interface Activity {
  id: string;
  activity_name: string;
  activity_type: 'screen_time' | 'outdoor' | 'indoor';
  duration_minutes: number;
  date: string;
  notes?: string;
  created_at: string;
}

const ActivityTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childProfile) {
      fetchActivities();
    }
  }, [childProfile]);

  const fetchActivities = async () => {
    if (!childProfile) return;

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('child_id', childProfile.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.log('Loading activities from localStorage:', error);
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
    if (!childProfile) return;

    const newActivity = {
      id: Date.now().toString(),
      child_id: childProfile.id,
      created_at: new Date().toISOString(),
      ...activityData
    };

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([newActivity])
        .select()
        .single();

      if (error) throw error;
      setActivities(prev => [data, ...prev]);
    } catch (error) {
      console.log('Saving activity to localStorage:', error);
      setActivities(prev => [newActivity, ...prev]);
      const key = `pandas-activities-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      const activities = stored ? JSON.parse(stored) : [];
      activities.unshift(newActivity);
      localStorage.setItem(key, JSON.stringify(activities));
    }

    toast({
      title: 'Success',
      description: 'Activity logged successfully'
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    } catch (error) {
      console.log('Deleting activity from localStorage:', error);
    }

    setActivities(prev => {
      const updated = prev.filter(activity => activity.id !== activityId);
      if (childProfile) {
        const key = `pandas-activities-${childProfile.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    });

    toast({
      title: 'Success',
      description: 'Activity deleted successfully'
    });
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Child Selected
          </h3>
          <p className="text-gray-500 text-center">
            Please select a child to track their activities
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Activity Tracker
        </h2>
        <p className="text-gray-600">
          Track screen time and activities for {childProfile.name}
        </p>
      </div>

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Log Activity
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <ActivityForm onSubmit={handleAddActivity} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading activities...</p>
                </div>
              ) : (
                <ActivityList 
                  activities={activities} 
                  onDelete={handleDeleteActivity} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityTracker;