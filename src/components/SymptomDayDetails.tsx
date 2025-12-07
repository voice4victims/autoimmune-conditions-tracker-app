import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SymptomRating } from '@/types/pandas';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SymptomDayDetailsProps {
  date: string;
  symptoms: SymptomRating[];
  onClose: () => void;
}

const SymptomDayDetails: React.FC<SymptomDayDetailsProps> = ({ date, symptoms, onClose }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return 'bg-green-100 text-green-800';
    if (severity <= 4) return 'bg-yellow-100 text-yellow-800';
    if (severity <= 6) return 'bg-orange-100 text-orange-800';
    if (severity <= 8) return 'bg-red-100 text-red-800';
    return 'bg-red-200 text-red-900';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Symptoms for {formatDate(date)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {symptoms.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No symptoms recorded for this day
          </p>
        ) : (
          <div className="space-y-4">
            {symptoms.map((symptom) => (
              <div key={symptom.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">
                    {symptom.symptomType.replace('_', ' ')}
                  </h3>
                  <Badge className={getSeverityColor(symptom.severity)}>
                    Severity: {symptom.severity}/10
                  </Badge>
                </div>
                {symptom.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Notes:</strong> {symptom.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomDayDetails;