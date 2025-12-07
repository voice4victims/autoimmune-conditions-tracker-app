import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Calendar, Clock, Pill } from 'lucide-react';
import { format } from 'date-fns';

interface Treatment {
  id: string;
  treatment_type: string;
  medication_name: string;
  dosage: string;
  administration_date: string;
  administration_time: string;
  symptoms_improved: boolean;
  improvement_notes?: string;
  created_at: string;
}

interface TreatmentHistoryProps {
  treatments: Treatment[];
}

const TreatmentHistory: React.FC<TreatmentHistoryProps> = ({ treatments }) => {
  const getTreatmentTypeColor = (type: string) => {
    switch (type) {
      case 'steroids': return 'bg-red-100 text-red-800';
      case 'ivig': return 'bg-blue-100 text-blue-800';
      case 'painkillers': return 'bg-yellow-100 text-yellow-800';
      case 'antibiotics': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  if (!treatments || treatments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Pill className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Treatments Recorded
          </h3>
          <p className="text-gray-500 text-center">
            Start tracking treatments to see history here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Treatment History</h3>
      {treatments.map((treatment) => (
        <Card key={treatment.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={getTreatmentTypeColor(treatment.treatment_type)}>
                  {treatment.treatment_type.toUpperCase()}
                </Badge>
                <h4 className="font-semibold">{treatment.medication_name}</h4>
              </div>
              {treatment.symptoms_improved ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Pill className="w-4 h-4" />
                <span>Dosage: {treatment.dosage}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(treatment.administration_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(treatment.administration_time)}</span>
              </div>
            </div>
            
            {treatment.improvement_notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Notes:</strong> {treatment.improvement_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TreatmentHistory;