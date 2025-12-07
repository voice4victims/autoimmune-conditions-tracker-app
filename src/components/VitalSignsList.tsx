import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface VitalSign {
  id: string;
  vital_type: string;
  value: number;
  unit: string;
  date_recorded: string;
  notes?: string;
}

const VITAL_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  heart_rate: 'Heart Rate',
  blood_pressure_systolic: 'BP Systolic',
  blood_pressure_diastolic: 'BP Diastolic',
  weight: 'Weight',
  height: 'Height',
  oxygen_saturation: 'O2 Saturation',
  respiratory_rate: 'Respiratory Rate'
};

interface VitalSignsListProps {
  refreshTrigger: number;
}

const VitalSignsList: React.FC<VitalSignsListProps> = ({ refreshTrigger }) => {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { childProfile } = useApp();
  const { user } = useAuth();

  const fetchVitals = async () => {
    if (!childProfile || !user) return;

    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('child_id', childProfile.id)
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVitals(data || []);
    } catch (error) {
      console.error('Error fetching vitals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vital signs.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVital = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vital_signs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVitals(vitals.filter(v => v.id !== id));
      toast({
        title: 'Deleted',
        description: 'Vital sign deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting vital:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vital sign.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchVitals();
  }, [childProfile, user, refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading vital signs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Vital Signs</CardTitle>
      </CardHeader>
      <CardContent>
        {vitals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No vital signs recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {vitals.map((vital) => (
              <div key={vital.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {VITAL_LABELS[vital.vital_type] || vital.vital_type}
                    </Badge>
                    <span className="font-semibold">
                      {vital.value} {vital.unit}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(vital.date_recorded), 'MMM d, yyyy h:mm a')}
                  </div>
                  {vital.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      {vital.notes}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteVital(vital.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VitalSignsList;