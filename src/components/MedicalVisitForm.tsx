import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { medicalVisitService } from '@/lib/firebaseService';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

interface MedicalVisitFormProps {
  onSuccess?: () => void;
}

const MedicalVisitForm: React.FC<MedicalVisitFormProps> = ({ onSuccess }) => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitType: '',
    visitDate: '',
    providerName: '',
    notes: '',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childProfile || !user) return;

    setLoading(true);
    try {
      await medicalVisitService.addVisit({
        child_id: childProfile.id,
        user_id: user.id,
        visit_type: formData.visitType,
        visit_date: formData.visitDate,
        provider_name: formData.providerName,
        notes: formData.notes,
        follow_up_required: formData.followUpRequired,
        follow_up_date: formData.followUpRequired ? formData.followUpDate : null,
        follow_up_notes: formData.followUpRequired ? formData.followUpNotes : null
      });

      toast({ title: 'Success', description: 'Medical visit recorded successfully' });
      setFormData({
        visitType: '',
        visitDate: '',
        providerName: '',
        notes: '',
        followUpRequired: false,
        followUpDate: '',
        followUpNotes: ''
      });
      onSuccess?.();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record medical visit', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Record Medical Visit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="visitType">Visit Type</Label>
            <Select value={formData.visitType} onValueChange={(value) => setFormData({ ...formData, visitType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select visit type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hospitalization">Hospitalization</SelectItem>
                <SelectItem value="provider_visit">Provider Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="visitDate">Visit Date</Label>
            <Input
              id="visitDate"
              type="date"
              value={formData.visitDate}
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="providerName">Provider/Hospital Name</Label>
            <Input
              id="providerName"
              value={formData.providerName}
              onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
              placeholder="Enter provider or hospital name"
            />
          </div>

          <div>
            <Label htmlFor="notes">Visit Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter notes from the visit..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUp"
              checked={formData.followUpRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, followUpRequired: checked as boolean })}
            />
            <Label htmlFor="followUp">Follow-up required</Label>
          </div>

          {formData.followUpRequired && (
            <div className="space-y-4 pl-6 border-l-2 border-blue-200">
              <div>
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                <Textarea
                  id="followUpNotes"
                  value={formData.followUpNotes}
                  onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                  placeholder="Enter follow-up instructions..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !formData.visitType || !formData.visitDate}>
            {loading ? 'Recording...' : 'Record Visit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MedicalVisitForm;