import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

interface TreatmentStat {
  name: string;
  type: string;
  avgImprovement: number;
  timesUsed: number;
  successRate: number;
}

interface Props {
  stats: TreatmentStat[];
}

const TreatmentEffectivenessStats: React.FC<Props> = ({ stats }) => {
  const sortedStats = [...stats].sort((a, b) => b.avgImprovement - a.avgImprovement);
  const topTreatment = sortedStats[0];

  const getEffectivenessColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800';
    if (rate >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (improvement < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <p>No treatment data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Treatment Effectiveness Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topTreatment && topTreatment.avgImprovement > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-700 font-medium">Most Effective Treatment</p>
            <p className="text-lg font-bold text-amber-900">{topTreatment.name}</p>
            <p className="text-sm text-amber-600">{topTreatment.successRate.toFixed(0)}% success rate</p>
          </div>
        )}
        
        <div className="space-y-3">
          {sortedStats.map((stat, index) => (
            <div key={stat.name} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="font-medium">{stat.name}</span>
                </div>
                {getTrendIcon(stat.avgImprovement)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{stat.type}</Badge>
                <Badge className={getEffectivenessColor(stat.successRate)}>
                  {stat.successRate.toFixed(0)}% effective
                </Badge>
                <Badge variant="secondary">{stat.timesUsed} uses</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentEffectivenessStats;
