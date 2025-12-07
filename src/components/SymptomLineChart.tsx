import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SymptomRating } from '@/types/pandas';

interface SymptomLineChartProps {
  data: SymptomRating[];
  selectedSymptom: string;
}

const SymptomLineChart: React.FC<SymptomLineChartProps> = ({ data, selectedSymptom }) => {
  const chartData = data
    .filter(item => item.symptomType === selectedSymptom)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      severity: item.severity,
      fullDate: item.date
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for selected symptom
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[0, 10]} 
            tick={{ fontSize: 12 }}
            label={{ value: 'Severity', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value) => [value, 'Severity']}
          />
          <Line 
            type="monotone" 
            dataKey="severity" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SymptomLineChart;