import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface ResponseData {
  date: string;
  avgSymptomScore: number;
  treatmentCount: number;
}

interface Props {
  data: ResponseData[];
}

const TreatmentResponseChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Not enough data to show treatment response curves</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Treatment Response Over Time
        </CardTitle>
        <p className="text-sm text-gray-600">
          Track how symptoms respond to treatments
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
              <Tooltip 
                labelFormatter={(val) => new Date(val).toLocaleDateString()}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgSymptomScore" 
                name="Avg Symptom Score"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="treatmentCount" 
                name="Treatments Given"
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentResponseChart;
