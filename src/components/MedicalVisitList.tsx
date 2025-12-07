import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Hospital, User, FileText, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MedicalVisit {
  id: string;
  visit_type: string;
  visit_date: string;
  provider_name: string;
  notes: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  created_at: string;
}

interface MedicalVisitListProps {
  refresh?: number;
}

const MedicalVisitList: React.FC<MedicalVisitListProps> = ({ refresh }) => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    if (!childProfile || !user) return;

    try {
      const { data, error } = await supabase
        .from('medical_visits')
        .select('*')
        .eq('child_id', childProfile.id)
        .eq('user_id', user.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load medical visits', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [childProfile, user, refresh]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getVisitTypeIcon = (type: string) => {
    return type === 'hospitalization' ? <Hospital className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getVisitTypeBadge = (type: string) => {
    return type === 'hospitalization' ? (
      <Badge variant="destructive">Hospitalization</Badge>
    ) : (
      <Badge variant="secondary">Provider Visit</Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading medical visits...</div>
        </CardContent>
      </Card>
    );
  }

  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No medical visits recorded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <Card key={visit.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getVisitTypeIcon(visit.visit_type)}
                <CardTitle className="text-lg">{visit.provider_name || 'Medical Visit'}</CardTitle>
              </div>
              {getVisitTypeBadge(visit.visit_type)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              {formatDate(visit.visit_date)}
            </div>
          </CardHeader>
          <CardContent>
            {visit.notes && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-sm">Visit Notes</span>
                </div>
                <p className="text-sm text-gray-700 pl-6">{visit.notes}</p>
              </div>
            )}
            
            {visit.follow_up_required && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-sm text-yellow-800">Follow-up Required</span>
                </div>
                {visit.follow_up_date && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-yellow-700">
                    <Clock className="w-4 h-4" />
                    Follow-up Date: {formatDate(visit.follow_up_date)}
                  </div>
                )}
                {visit.follow_up_notes && (
                  <p className="text-sm text-yellow-700 pl-6">{visit.follow_up_notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MedicalVisitList;