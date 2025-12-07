import React, { useState } from 'react';
import { SymptomRating } from '@/types/pandas';
import SymptomGraphSelector, { GraphType } from './SymptomGraphSelector';
import SymptomLineChart from './SymptomLineChart';
import SymptomBarChart from './SymptomBarChart';
import SymptomCumulativeChart from './SymptomCumulativeChart';
import SymptomHeatmap from './SymptomHeatmap';
import MultiSymptomAnalysis from './MultiSymptomAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SymptomGraphViewsProps {
  symptoms: SymptomRating[];
  availableSymptoms: string[];
}

const SymptomGraphViews: React.FC<SymptomGraphViewsProps> = ({ 
  symptoms, 
  availableSymptoms 
}) => {
  const [selectedGraph, setSelectedGraph] = useState<GraphType>('line');
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');

  const renderSingleSymptomChart = () => {
    if (!selectedSymptom) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Please select a symptom to view chart
        </div>
      );
    }

    switch (selectedGraph) {
      case 'line':
        return <SymptomLineChart data={symptoms} selectedSymptom={selectedSymptom} />;
      case 'bar':
        return <SymptomBarChart data={symptoms} selectedSymptom={selectedSymptom} />;
      case 'cumulative':
        return <SymptomCumulativeChart data={symptoms} selectedSymptom={selectedSymptom} />;
      case 'heatmap':
        return <SymptomHeatmap symptoms={symptoms} />;
      default:
        return <SymptomLineChart data={symptoms} selectedSymptom={selectedSymptom} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Symptom Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Single Symptom
              </TabsTrigger>
              <TabsTrigger value="multi" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Multi-Symptom
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="mt-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={selectedSymptom} onValueChange={setSelectedSymptom}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Select symptom" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSymptoms.map(symptom => (
                        <SelectItem key={symptom} value={symptom}>
                          {symptom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <SymptomGraphSelector 
                    selectedGraph={selectedGraph}
                    onGraphChange={setSelectedGraph}
                  />
                </div>
                {renderSingleSymptomChart()}
              </div>
            </TabsContent>
            
            <TabsContent value="multi" className="mt-6">
              <MultiSymptomAnalysis 
                symptoms={symptoms}
                availableSymptoms={availableSymptoms}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SymptomGraphViews;