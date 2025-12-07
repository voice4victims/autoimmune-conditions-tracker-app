import React, { useState } from 'react';
import { SymptomRating } from '@/types/pandas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MultiSymptomSelector from './MultiSymptomSelector';
import MultiSymptomLineChart from './MultiSymptomLineChart';
import MultiSymptomBarChart from './MultiSymptomBarChart';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, LineChart } from 'lucide-react';

interface MultiSymptomAnalysisProps {
  symptoms: SymptomRating[];
  availableSymptoms: string[];
}

const MultiSymptomAnalysis: React.FC<MultiSymptomAnalysisProps> = ({ 
  symptoms, 
  availableSymptoms 
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Calculate symptom counts
  const symptomCounts = React.useMemo(() => {
    return symptoms.reduce((acc, symptom) => {
      acc[symptom.symptomType] = (acc[symptom.symptomType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [symptoms]);

  // Calculate average severity for selected symptoms
  const averageSeverity = React.useMemo(() => {
    if (selectedSymptoms.length === 0) return {};
    
    return selectedSymptoms.reduce((acc, symptom) => {
      const symptomData = symptoms.filter(s => s.symptomType === symptom);
      const avg = symptomData.reduce((sum, s) => sum + s.severity, 0) / symptomData.length;
      acc[symptom] = Math.round(avg * 10) / 10;
      return acc;
    }, {} as Record<string, number>);
  }, [symptoms, selectedSymptoms]);

  return (
    <div className="space-y-6">
      <MultiSymptomSelector
        availableSymptoms={availableSymptoms}
        selectedSymptoms={selectedSymptoms}
        onSymptomToggle={handleSymptomToggle}
        symptomCounts={symptomCounts}
      />

      {selectedSymptoms.length > 0 && (
        <>
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSymptoms.map(symptom => (
                  <div key={symptom} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">{symptom}</div>
                    <div className="text-2xl font-bold mt-1">
                      {averageSeverity[symptom]}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg severity ({symptomCounts[symptom]} entries)
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Symptom Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="line" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="line" className="flex items-center gap-2">
                    <LineChart className="w-4 h-4" />
                    Line Chart
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Bar Chart
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="line" className="mt-4">
                  <MultiSymptomLineChart 
                    data={symptoms} 
                    selectedSymptoms={selectedSymptoms} 
                  />
                </TabsContent>
                
                <TabsContent value="bar" className="mt-4">
                  <MultiSymptomBarChart 
                    data={symptoms} 
                    selectedSymptoms={selectedSymptoms} 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MultiSymptomAnalysis;