import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Activity, Brain, Award } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import TreatmentEffectivenessStats from './analytics/TreatmentEffectivenessStats';
import TreatmentResponseChart from './analytics/TreatmentResponseChart';
import SymptomCategoryBreakdown from './analytics/SymptomCategoryBreakdown';
import PredictiveInsights from './analytics/PredictiveInsights';

const AdvancedAnalyticsDashboard: React.FC = () => {
  const { childProfile, treatments } = useApp();
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [responseData, setResponseData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (childProfile?.id) {
      loadSymptoms();
    }
  }, [childProfile, treatments]);

  const loadSymptoms = () => {
    const key = `pandas-symptoms-${childProfile?.id}`;
    const stored = localStorage.getItem(key);
    const symptomData = stored ? JSON.parse(stored) : [];
    setSymptoms(symptomData);
    analyzeData(symptomData);
  };

  const analyzeData = (symptomData: any[]) => {
    // Calculate treatment effectiveness stats
    const treatmentMap = new Map();
    treatments.forEach(t => {
      const key = t.medication_name;
      if (!treatmentMap.has(key)) {
        treatmentMap.set(key, { name: key, type: t.treatment_type, improved: 0, total: 0 });
      }
      const stat = treatmentMap.get(key);
      stat.total++;
      if (t.symptoms_improved) stat.improved++;
    });
    
    const statsArray = Array.from(treatmentMap.values()).map(s => ({
      ...s,
      timesUsed: s.total,
      successRate: s.total > 0 ? (s.improved / s.total) * 100 : 0,
      avgImprovement: s.total > 0 ? (s.improved / s.total) * 10 : 0
    }));
    setStats(statsArray);

    // Calculate response data over time
    const dateMap = new Map();
    symptomData.forEach(s => {
      const date = s.date.split('T')[0];
      if (!dateMap.has(date)) dateMap.set(date, { scores: [], treatments: 0 });
      dateMap.get(date).scores.push(s.severity);
    });
    treatments.forEach(t => {
      const date = t.administration_date;
      if (dateMap.has(date)) dateMap.get(date).treatments++;
    });
    
    const response = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        avgSymptomScore: data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length,
        treatmentCount: data.treatments
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setResponseData(response);

    // Calculate category breakdown
    const catMap = new Map();
    symptomData.forEach(s => {
      if (!catMap.has(s.symptomType)) catMap.set(s.symptomType, { severities: [], count: 0 });
      catMap.get(s.symptomType).severities.push(s.severity);
      catMap.get(s.symptomType).count++;
    });
    
    const categories = Array.from(catMap.entries()).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      avgSeverity: data.severities.reduce((a: number, b: number) => a + b, 0) / data.severities.length
    }));
    setCategoryData(categories);

    // Generate insights
    generateInsights(statsArray, categories, response);
  };

  const generateInsights = (stats: any[], categories: any[], response: any[]) => {
    const newInsights: any[] = [];
    
    const topTreatment = stats.sort((a, b) => b.successRate - a.successRate)[0];
    if (topTreatment?.successRate > 50) {
      newInsights.push({
        type: 'success',
        title: `${topTreatment.name} shows strong results`,
        description: `This treatment has a ${topTreatment.successRate.toFixed(0)}% success rate based on ${topTreatment.timesUsed} uses.`,
        confidence: Math.min(90, 50 + topTreatment.timesUsed * 5)
      });
    }

    const worstSymptom = categories.sort((a, b) => b.avgSeverity - a.avgSeverity)[0];
    if (worstSymptom?.avgSeverity > 6) {
      newInsights.push({
        type: 'warning',
        title: `${worstSymptom.category} needs attention`,
        description: `Average severity of ${worstSymptom.avgSeverity.toFixed(1)}/10. Consider discussing with your healthcare provider.`
      });
    }

    if (response.length >= 7) {
      const recent = response.slice(-7);
      const trend = recent[recent.length - 1].avgSymptomScore - recent[0].avgSymptomScore;
      newInsights.push({
        type: trend < 0 ? 'success' : 'prediction',
        title: trend < 0 ? 'Symptoms improving' : 'Monitor symptom trends',
        description: trend < 0 
          ? `Symptoms decreased by ${Math.abs(trend).toFixed(1)} points over the last week.`
          : `Symptoms increased by ${trend.toFixed(1)} points. Review recent changes.`,
        confidence: 75
      });
    }

    setInsights(newInsights);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-600">Statistical insights for treatment optimization</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm"><Award className="w-4 h-4 mr-1" />Stats</TabsTrigger>
          <TabsTrigger value="response" className="text-xs sm:text-sm"><Activity className="w-4 h-4 mr-1" />Response</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs sm:text-sm"><BarChart3 className="w-4 h-4 mr-1" />Breakdown</TabsTrigger>
          <TabsTrigger value="insights" className="text-xs sm:text-sm"><Brain className="w-4 h-4 mr-1" />Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><TreatmentEffectivenessStats stats={stats} /></TabsContent>
        <TabsContent value="response"><TreatmentResponseChart data={responseData} /></TabsContent>
        <TabsContent value="breakdown"><SymptomCategoryBreakdown data={categoryData} /></TabsContent>
        <TabsContent value="insights"><PredictiveInsights insights={insights} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
