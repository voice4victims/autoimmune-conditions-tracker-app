import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Utensils, Coffee } from 'lucide-react';
import { format } from 'date-fns';

interface FoodEntry {
  id: string;
  date: string;
  meal_type: string;
  food_name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  created_at: string;
}

interface FoodDiaryListProps {
  entries: FoodEntry[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const FoodDiaryList: React.FC<FoodDiaryListProps> = ({ entries, onDelete, isLoading }) => {
  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-green-100 text-green-800';
      case 'dinner': return 'bg-blue-100 text-blue-800';
      case 'snack': return 'bg-purple-100 text-purple-800';
      case 'drink': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    return mealType === 'drink' ? <Coffee className="w-4 h-4" /> : <Utensils className="w-4 h-4" />;
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Utensils className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Food Entries Yet</h3>
          <p className="text-gray-500 text-center">Start tracking your child's food and drink intake</p>
        </CardContent>
      </Card>
    );
  }

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedEntries)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, dateEntries]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dateEntries
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getMealTypeIcon(entry.meal_type)}
                          <Badge className={getMealTypeColor(entry.meal_type)}>
                            {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{entry.food_name}</h4>
                        {(entry.quantity || entry.unit) && (
                          <p className="text-sm text-gray-600 mb-1">
                            Quantity: {entry.quantity} {entry.unit}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-gray-600 italic">{entry.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(entry.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default FoodDiaryList;