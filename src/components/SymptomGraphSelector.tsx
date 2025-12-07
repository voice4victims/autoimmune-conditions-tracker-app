import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, LineChart, TrendingUp, Calendar } from 'lucide-react';

export type GraphType = 'line' | 'bar' | 'cumulative' | 'heatmap';

interface SymptomGraphSelectorProps {
  selectedGraph: GraphType;
  onGraphChange: (graph: GraphType) => void;
}

const SymptomGraphSelector: React.FC<SymptomGraphSelectorProps> = ({
  selectedGraph,
  onGraphChange
}) => {
  const graphOptions = [
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'cumulative', label: 'Cumulative Bar', icon: TrendingUp },
    { value: 'heatmap', label: 'Heatmap', icon: Calendar }
  ];

  return (
    <Select value={selectedGraph} onValueChange={onGraphChange}>
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="Select graph type" />
      </SelectTrigger>
      <SelectContent>
        {graphOptions.map(option => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {option.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default SymptomGraphSelector;