import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SymptomRating } from '@/types/pandas';

interface SymptomCumulativeChartProps {
  data: SymptomRating[];
  selectedSymptom: string;
}

const SymptomCumulativeChart: React.FC<SymptomCumulativeChartProps> = ({ data, selectedSymptom }) => {
  const filteredData = data
    .filter(item => item.symptomType === selectedSymptom)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available for selected symptom
      </div>
    );
  }

  // Calculate cumulative severity
  let cumulativeSum = 0;
  const chartData = filteredData.map(item => {
    cumulativeSum += item.severity;
    return {
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      cumulative: cumulativeSum,
      severity: item.severity,
      fullDate: item.date
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Cumulative Severity', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value, name) => {
              if (name === 'cumulative') return [value, 'Cumulative Total'];
              return [value, 'Daily Severity'];
            }}
          />
          <Bar 
            dataKey="cumulative" 
            fill="#3b82f6"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SymptomCumulativeChart;