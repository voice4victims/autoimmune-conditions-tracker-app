import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SymptomRating } from '@/types/pandas';
import { format } from 'date-fns';

interface MultiSymptomBarChartProps {
  data: SymptomRating[];
  selectedSymptoms: string[];
}

const MultiSymptomBarChart: React.FC<MultiSymptomBarChartProps> = ({ data, selectedSymptoms }) => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];
  
  // Process data for multiple symptoms
  const processedData = React.useMemo(() => {
    const dateMap = new Map<string, any>();
    
    data.forEach(symptom => {
      if (selectedSymptoms.includes(symptom.symptomType)) {
        const dateKey = format(new Date(symptom.date), 'yyyy-MM-dd');
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, { date: dateKey, displayDate: format(new Date(symptom.date), 'MMM dd') });
        }
        
        const entry = dateMap.get(dateKey);
        entry[symptom.symptomType] = symptom.severity;
      }
    });
    
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, selectedSymptoms]);

  if (selectedSymptoms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Please select symptoms to compare
      </div>
    );
  }

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={[0, 10]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Severity', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: any, name: string) => [value, name]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          {selectedSymptoms.map((symptom, index) => (
            <Bar
              key={symptom}
              dataKey={symptom}
              fill={colors[index % colors.length]}
              name={symptom}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiSymptomBarChart;