import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CategoryData {
  category: string;
  count: number;
  avgSeverity: number;
}

interface Props {
  data: CategoryData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const SymptomCategoryBreakdown: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <PieChartIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No symptom data available for breakdown</p>
        </CardContent>
      </Card>
    );
  }

  const sortedData = [...data].sort((a, b) => b.avgSeverity - a.avgSeverity);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-purple-500" />
          Symptom Category Breakdown
        </CardTitle>
        <p className="text-sm text-gray-600">
          Average severity by symptom type
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="category" 
                tick={{ fontSize: 10 }} 
                width={75}
                tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value: number) => [value.toFixed(1), 'Avg Severity']}
              />
              <Bar dataKey="avgSeverity" name="Avg Severity" radius={[0, 4, 4, 0]}>
                {sortedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {sortedData.slice(0, 4).map((item, index) => (
            <div key={item.category} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
              <span className="truncate">{item.category}</span>
              <span className="text-gray-500 ml-auto">{item.count}x</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SymptomCategoryBreakdown;
