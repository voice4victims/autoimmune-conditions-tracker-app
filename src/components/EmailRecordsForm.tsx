import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Mail, Send, Loader2 } from 'lucide-react';

const EmailRecordsForm: React.FC = () => {
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    doctorEmail: '',
    doctorName: '',
    message: '',
    includeSymptoms: true,
    includeTreatments: true,
    includeNotes: true,
    includeVitals: true,
    includeFoodDiary: true,
    includeActivities: true,
    dateRange: '30'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childProfile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-records', {
        body: {
          childId: childProfile.id,
          doctorEmail: formData.doctorEmail,
          doctorName: formData.doctorName,
          message: formData.message,
          includeSymptoms: formData.includeSymptoms,
          includeTreatments: formData.includeTreatments,
          includeNotes: formData.includeNotes,
          includeVitals: formData.includeVitals,
          includeFoodDiary: formData.includeFoodDiary,
          includeActivities: formData.includeActivities,
          dateRange: parseInt(formData.dateRange)
        }
      });

      if (error) throw error;

      toast({
        title: 'Email Sent Successfully',
        description: `Records have been sent to ${formData.doctorName || formData.doctorEmail}`,
      });

      setFormData({
        ...formData,
        message: ''
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error Sending Email',
        description: 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Mail className="w-4 h-4 mr-2" />
          Email Records to Doctor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Records to Doctor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctorEmail">Doctor's Email *</Label>
              <Input
                id="doctorEmail"
                type="email"
                value={formData.doctorEmail}
                onChange={(e) => setFormData({...formData, doctorEmail: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="doctorName">Doctor's Name</Label>
              <Input
                id="doctorName"
                value={formData.doctorName}
                onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Optional message to include with the records..."
              rows={3}
            />
          </div>

          <div>
            <Label>Include Records (Last {formData.dateRange} days)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { key: 'includeSymptoms', label: 'Symptoms' },
                { key: 'includeTreatments', label: 'Treatments' },
                { key: 'includeNotes', label: 'Notes' },
                { key: 'includeVitals', label: 'Vital Signs' },
                { key: 'includeFoodDiary', label: 'Food Diary' },
                { key: 'includeActivities', label: 'Activities' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={formData[key as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, [key]: checked})
                    }
                  />
                  <Label htmlFor={key} className="text-sm">{label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading || !formData.doctorEmail} className="w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Records
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailRecordsForm;