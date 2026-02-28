import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { SymptomRating } from '@/types/pandas';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import SymptomGraphViews from './SymptomGraphViews';
import { cn } from '@/lib/utils';

interface SymptomHistoryDetailsProps {
  symptoms?: SymptomRating[];
}

const SymptomHistoryDetails: React.FC<SymptomHistoryDetailsProps> = ({ symptoms = [] }) => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('7');
  const [dbSymptoms, setDbSymptoms] = useState<SymptomRating[]>([]);
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (childProfile) {
      loadSymptoms();
    }
  }, [childProfile]);

  const loadSymptoms = async () => {
    if (!childProfile || !user) return;

    setLoading(true);
    try {
      const symptomsRef = collection(db, 'symptom_ratings');
      const q = query(symptomsRef, where('user_id', '==', user.uid), where('child_id', '==', childProfile.id), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const formattedSymptoms = data.map(item => ({
          id: item.id,
          symptomType: item.symptom_type,
          severity: item.severity,
          date: item.date,
          notes: item.notes,
          isImportant: item.is_important
        }));

        setDbSymptoms(formattedSymptoms as SymptomRating[]);

        const uniqueSymptoms = [...new Set(data.map(item => item.symptom_type))]
          .filter(symptom => symptom && symptom.trim() !== '');
        setAvailableSymptoms(uniqueSymptoms);
      }
    } catch (error) {
      console.error('Error loading symptoms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorForSeverity = (severity: number) => {
    if (severity <= 2) return 'bg-green-100 text-green-800 border-green-200';
    if (severity <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (severity <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 2) return 'Mild';
    if (severity <= 5) return 'Moderate';
    if (severity <= 7) return 'Severe';
    return 'Critical';
  };

  const filterByTimeRange = (symptomList: SymptomRating[]) => {
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return symptomList.filter(s => new Date(s.date) >= cutoff);
  };

  const groupedSymptoms = dbSymptoms.reduce((acc, symptom) => {
    const symptomType = symptom.symptomType || 'Unknown';
    if (!acc[symptomType]) {
      acc[symptomType] = [];
    }
    acc[symptomType].push(symptom);
    return acc;
  }, {} as Record<string, SymptomRating[]>);

  const filteredSymptoms = selectedSymptom
    ? filterByTimeRange(groupedSymptoms[selectedSymptom] || [])
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading symptom history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graph Views Section */}
      <SymptomGraphViews
        symptoms={dbSymptoms}
        availableSymptoms={availableSymptoms}
      />

      {/* Detailed History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedSymptom} onValueChange={setSelectedSymptom}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select symptom to analyze" />
            </SelectTrigger>
            <SelectContent>
              {availableSymptoms.length > 0 ? (
                availableSymptoms.map(type => (
                  <SelectItem key={type} value={type}>
                    {type} ({groupedSymptoms[type]?.length || 0})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No symptoms recorded
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedSymptom && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedSymptom}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSymptoms.slice().reverse().map((symptom, index) => (
                  <div key={`${symptom.id || index}-${symptom.date}`} className={cn(
                    "border rounded-lg p-3",
                    symptom.isImportant ? "bg-amber-50 border-amber-200" : "bg-gray-50"
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {symptom.isImportant && (
                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                          )}
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {new Date(symptom.date).toLocaleDateString()}
                          </span>
                          <Clock className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-sm text-gray-600">
                            {new Date(symptom.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {symptom.notes && (
                          <p className="text-sm text-gray-700 mt-2 bg-white p-2 rounded border">
                            {symptom.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`${getColorForSeverity(symptom.severity)} text-lg px-3 py-1`}>
                          {symptom.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {getSeverityLabel(symptom.severity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SymptomHistoryDetails;