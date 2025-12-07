import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, Calendar } from 'lucide-react';

interface Insight {
  type: 'recommendation' | 'warning' | 'success' | 'prediction';
  title: string;
  description: string;
  confidence?: number;
}

interface Props {
  insights: Insight[];
}

const PredictiveInsights: React.FC<Props> = ({ insights }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'prediction': return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default: return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'recommendation': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'prediction': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Continue tracking to receive predictive insights</p>
          <p className="text-sm mt-2">We need more data to generate personalized recommendations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Predictive Insights
        </CardTitle>
        <p className="text-sm text-gray-600">
          AI-powered recommendations based on your data
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className={`border rounded-lg p-4 ${getBgColor(insight.type)}`}>
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{insight.title}</h4>
                  {insight.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence}% confidence
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PredictiveInsights;
