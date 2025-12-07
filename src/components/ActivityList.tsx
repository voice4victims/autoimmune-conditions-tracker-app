import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Monitor, TreePine, Home, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  activity_name: string;
  activity_type: 'screen_time' | 'outdoor' | 'indoor';
  duration_minutes: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface ActivityListProps {
  activities: Activity[];
  onDelete: (id: string) => void;
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onDelete }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'screen_time': return <Monitor className="w-4 h-4" />;
      case 'outdoor': return <TreePine className="w-4 h-4" />;
      case 'indoor': return <Home className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'screen_time': return 'bg-blue-100 text-blue-800';
      case 'outdoor': return 'bg-green-100 text-green-800';
      case 'indoor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'screen_time': return 'Screen Time';
      case 'outdoor': return 'Outdoor';
      case 'indoor': return 'Indoor';
      default: return type;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Activities Logged
          </h3>
          <p className="text-gray-500 text-center">
            Start logging your child's activities to track their daily routine
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getActivityIcon(activity.activity_type)}
                  <h3 className="font-semibold text-gray-900">
                    {activity.activity_name}
                  </h3>
                  <Badge className={getActivityTypeColor(activity.activity_type)}>
                    {getActivityTypeLabel(activity.activity_type)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(activity.duration_minutes)}
                  </span>
                  <span>{format(new Date(activity.date), 'MMM d, yyyy')}</span>
                </div>
                
                {activity.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {activity.notes}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(activity.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ActivityList;