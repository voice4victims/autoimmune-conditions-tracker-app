import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface CorrelationData {
  evalDate: string;
  score: number;
  scoreChange: number | null;
  treatments: any[];
  trend: 'improved' | 'worsened' | 'stable' | null;
}

const PTECTreatmentCorrelation: React.FC = () => {
  const { childProfile, treatments } = useApp();
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);

  useEffect(() => {
    if (childProfile?.id) {
      const stored = localStorage.getItem(`ptec_${childProfile.id}`);
      if (stored) {
        const evaluations = JSON.parse(stored);
        analyzeCorrelations(evaluations);
      }
    }
  }, [childProfile, treatments]);

  const analyzeCorrelations = (evaluations: any[]) => {
    const sorted = [...evaluations].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const results: CorrelationData[] = sorted.map((evaluation, index) => {
      const evalDate = new Date(evaluation.date);
      const prevEval = index > 0 ? sorted[index - 1] : null;
      const prevDate = prevEval ? new Date(prevEval.date) : null;

      const relevantTreatments = treatments.filter(t => {
        const tDate = new Date(t.administration_date);
        if (prevDate) {
          return tDate >= prevDate && tDate <= evalDate;
        }
        return tDate <= evalDate;
      });

      const scoreChange = prevEval ? evaluation.score - prevEval.score : null;
      let trend: 'improved' | 'worsened' | 'stable' | null = null;
      if (scoreChange !== null) {
        if (scoreChange < -5) trend = 'improved';
        else if (scoreChange > 5) trend = 'worsened';
        else trend = 'stable';
      }

      return {
        evalDate: evaluation.date,
        score: evaluation.score,
        scoreChange,
        treatments: relevantTreatments,
        trend
      };
    });

    setCorrelations(results);
  };

  const getTrendIcon = (trend: string | null) => {
    if (trend === 'improved') return <TrendingDown className="w-4 h-4 text-green-600" />;
    if (trend === 'worsened') return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trend === 'stable') return <Minus className="w-4 h-4 text-gray-600" />;
    return null;
  };

  const getTrendColor = (trend: string | null) => {
    if (trend === 'improved') return 'bg-green-50 border-green-200';
    if (trend === 'worsened') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  if (correlations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No PTEC evaluations found. Complete at least two evaluations to see treatment correlations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Treatment-PTEC Score Correlation</CardTitle>
          <p className="text-sm text-gray-600">
            See which treatments coincide with score changes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {correlations.map((corr, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getTrendColor(corr.trend)}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{new Date(corr.evalDate).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">Score: {corr.score}/306</Badge>
                    {corr.scoreChange !== null && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(corr.trend)}
                        <span className="text-sm font-medium">
                          {corr.scoreChange > 0 ? '+' : ''}{corr.scoreChange}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {corr.treatments.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Treatments during this period:
                  </p>
                  <div className="space-y-2">
                    {corr.treatments.map((t, i) => (
                      <div key={i} className="bg-white rounded p-2 text-sm border">
                        <div className="font-medium">{t.medication_name}</div>
                        <div className="text-gray-600 text-xs">
                          {t.treatment_type} • {t.dosage} • {new Date(t.administration_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No treatments recorded during this period</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default PTECTreatmentCorrelation;
