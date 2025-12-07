import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import FoodDiaryForm from './FoodDiaryForm';
import FoodDiaryList from './FoodDiaryList';
import { Plus, History, Utensils } from 'lucide-react';

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
  const { toast } = useToast();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  useEffect(() => {
    if (childProfile?.id) {
      fetchEntries();
    }
  }, [childProfile?.id]);

  const fetchEntries = async () => {
    if (!childProfile?.id) return;

    try {
      setIsLoadingEntries(true);
      const { data, error } = await supabase
        .from('food_diary')
        .select('*')
        .eq('child_id', childProfile.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.log('Loading food diary from localStorage:', error);
      const key = `pandas-food-diary-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      setEntries(stored ? JSON.parse(stored) : []);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleAddEntry = async (entryData: any) => {
    if (!childProfile?.id) return;

    const newEntry = {
      id: Date.now().toString(),
      child_id: childProfile.id,
      created_at: new Date().toISOString(),
      ...entryData
    };

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('food_diary')
        .insert([newEntry])
        .select()
        .single();

      if (error) throw error;
      setEntries(prev => [data, ...prev]);
    } catch (error) {
      console.log('Saving food diary to localStorage:', error);
      setEntries(prev => [newEntry, ...prev]);
      const key = `pandas-food-diary-${childProfile.id}`;
      const stored = localStorage.getItem(key);
      const entries = stored ? JSON.parse(stored) : [];
      entries.unshift(newEntry);
      localStorage.setItem(key, JSON.stringify(entries));
    } finally {
      setIsLoading(false);
    }

    toast({
      title: 'Success',
      description: 'Food diary entry added successfully'
    });
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('food_diary')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    } catch (error) {
      console.log('Deleting food diary from localStorage:', error);
    }

    setEntries(prev => {
      const updated = prev.filter(entry => entry.id !== entryId);
      if (childProfile) {
        const key = `pandas-food-diary-${childProfile.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    });

    setIsLoading(false);
    toast({
      title: 'Success',
      description: 'Food diary entry deleted successfully'
    });
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Utensils className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Child Selected</h3>
          <p className="text-gray-500 text-center">Please select a child to track their food diary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Food Diary</h2>
        <p className="text-gray-600">Track {childProfile.name}'s food and drink intake</p>
      </div>

      <Tabs defaultValue="add" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Entry
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <FoodDiaryForm onAddEntry={handleAddEntry} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="history">
          {isLoadingEntries ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading food diary entries...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <FoodDiaryList 
              entries={entries} 
              onDelete={handleDeleteEntry} 
              isLoading={isLoading} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FoodDiaryTracker;