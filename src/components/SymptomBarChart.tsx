import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SymptomRating } from '@/types/pandas';

interface SymptomBarChartProps {
  data: SymptomRating[];
  selectedSymptom: string;
}

const SymptomBarChart: React.FC<SymptomBarChartProps> = ({ data, selectedSymptom }) => {
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

  const getBarColor = (severity: number) => {
    if (severity <= 2) return '#22c55e'; // green
    if (severity <= 5) return '#eab308'; // yellow
    if (severity <= 7) return '#f97316'; // orange
    return '#ef4444'; // red
  };

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
            domain={[0, 10]} 
            tick={{ fontSize: 12 }}
            label={{ value: 'Severity', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value) => [value, 'Severity']}
          />
          <Bar 
            dataKey="severity" 
            fill={(entry) => getBarColor(entry?.severity || 0)}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SymptomBarChart;