import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { SymptomRating } from '@/types/pandas';
import SymptomHistoryDetails from './SymptomHistoryDetails';
import { BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SymptomChart: React.FC = () => {
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState<SymptomRating[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (childProfile) {
      fetchSymptoms();
    }
  }, [childProfile]);

  const fetchSymptoms = async () => {
    if (!childProfile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptom_ratings')
        .select('*')
        .eq('child_id', childProfile.id)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Transform database data to match SymptomRating interface
      const formattedSymptoms = (data || []).map(item => ({
        id: item.id,
        symptomType: item.symptom_type,
        severity: item.severity,
        date: item.date,
        notes: item.notes
      }));
      
      setSymptoms(formattedSymptoms);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load symptom history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Please select a child profile to view symptom history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Symptom History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm sm:text-base">Loading symptoms...</p>
          </div>
        ) : symptoms.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm sm:text-base">No symptoms recorded yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">Start tracking symptoms to see history here</p>
          </div>
        ) : (
          <SymptomHistoryDetails symptoms={symptoms} />
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomChart;