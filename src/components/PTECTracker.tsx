import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingDown, TrendingUp, Minus, Activity, History } from 'lucide-react';
import PTECForm from './PTECForm';
import PTECTreatmentCorrelation from './PTECTreatmentCorrelation';
import { useApp } from '@/contexts/AppContext';


const PTECTracker: React.FC = () => {
  const { childProfile } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  useEffect(() => {
    if (childProfile?.id) {
      const stored = localStorage.getItem(`ptec_${childProfile.id}`);
      if (stored) {
        setEvaluations(JSON.parse(stored));
      }
    }
  }, [childProfile]);

  const handleSubmit = (data: any) => {
    const newEval = { ...data, id: Date.now() };
    const updated = [...evaluations, newEval];
    setEvaluations(updated);
    if (childProfile?.id) {
      localStorage.setItem(`ptec_${childProfile.id}`, JSON.stringify(updated));
    }
    setShowForm(false);
  };

  const getTrend = (index: number) => {
    if (index === 0) return null;
    const current = evaluations[index].score;
    const previous = evaluations[index - 1].score;
    const diff = current - previous;
    if (diff > 0) return { icon: TrendingUp, color: 'text-red-600', text: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-green-600', text: `${diff}` };
    return { icon: Minus, color: 'text-gray-600', text: '0' };
  };

  if (showForm) {
    return <PTECForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">PTEC Evaluations</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Evaluation
        </Button>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Treatment Correlation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {evaluations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No evaluations yet. Start by creating your first PTEC evaluation.
                </p>
              ) : (
                <div className="space-y-3">
                  {evaluations.map((evaluation, index) => {
                    const trend = getTrend(index);
                    const TrendIcon = trend?.icon;
                    return (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {new Date(evaluation.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {evaluation.patientDetails.flareStatus || 'Status not recorded'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {evaluation.score} / 306
                          </Badge>
                          {trend && TrendIcon && (
                            <div className={`flex items-center gap-1 ${trend.color}`}>
                              <TrendIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">{trend.text}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation">
          <PTECTreatmentCorrelation />
        </TabsContent>
      </Tabs>
    </div>

  );
};

export default PTECTracker;
