
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const EmailProvider: React.FC = () => {
  const { childProfile, treatments, symptoms, notes } = useApp();
  const [providerEmail, setProviderEmail] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (providerEmail === '') {
      setHasConsented(false);
    }
  }, [providerEmail]);

  const generateEmailBody = () => {
    if (!childProfile) return '';

    let body = `Dear Medical Provider,\n\nPlease find the following summary of ${childProfile.name}'s records below.\n\n`;

    body += `--- Child Profile ---\n`;
    body += `Name: ${childProfile.name}\n`;
    body += `Date of Birth: ${new Date(childProfile.dateOfBirth).toLocaleDateString()}\n`;
    if (childProfile.diagnosisDate) {
      body += `Diagnosis Date: ${new Date(childProfile.diagnosisDate).toLocaleDateString()}\n`;
    }
    body += '\n';

    if (treatments.length > 0) {
      body += '--- Recent Treatments ---\n';
      treatments.slice(0, 10).forEach(t => {
        body += `\n- ${t.medication_name} (${t.dosage}) on ${new Date(t.administration_date).toLocaleDateString()}`;
      });
      body += '\n\n';
    }

    if (symptoms.length > 0) {
        body += '--- Recent Symptoms ---\n';
        const recentSymptoms = [...symptoms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        recentSymptoms.forEach(s => {
            body += `Date: ${new Date(s.date).toLocaleDateString()}\n`;
            body += `Symptoms: ${s.symptoms.join(', ')}\n`;
            body += `Severity: ${s.severity}\n\n`;
        });
    }

    if (notes.length > 0) {
      body += '--- Recent Notes ---\n';
      notes.slice(0, 5).forEach(n => {
        body += `\n- [${new Date(n.date).toLocaleDateString()}] ${n.note}`;
      });
      body += '\n\n';
    }

    if (additionalMessage) {
      body += '--- Additional Message ---\n';
      body += `${additionalMessage}\n\n`;
    }

    body += `Best regards,\n${childProfile.name}'s Guardian`;

    return body;
  };

  const handleSendEmail = () => {
    if (!providerEmail) {
      toast({ title: 'Error', description: 'Please enter the provider\'s email address.' });
      return;
    }

    if (!childProfile) {
        toast({ title: 'Error', description: 'No child profile selected.' });
        return;
    }

    if (!hasConsented) {
      setShowWarning(true);
      return;
    }

    const subject = `Health Records for ${childProfile.name}`;
    const body = generateEmailBody();

    const mailtoLink = `mailto:${providerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Email Records to Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="provider-email">Provider's Email</label>
            <Input
              id="provider-email"
              type="email"
              placeholder="provider@example.com"
              value={providerEmail}
              onChange={e => setProviderEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="additional-message">Additional Message</label>
            <Textarea
              id="additional-message"
              placeholder="Add any extra information for your provider..."
              value={additionalMessage}
              onChange={e => setAdditionalMessage(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="consent" checked={hasConsented} onCheckedChange={(checked) => setHasConsented(checked as boolean)} />
            <label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I acknowledge and consent to sending this information.
            </label>
          </div>
          <Button onClick={handleSendEmail} className="w-full">Send Email</Button>
        </CardContent>
      </Card>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>HIPAA & PHI Warning</DialogTitle>
            <DialogDescription>
              You are about to send Protected Health Information (PHI). Please double-check that you are sending this information to the correct and intended email address. Misdirected PHI can be a violation of HIPAA regulations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowWarning(false)}>Cancel</Button>
            <Button onClick={() => {
              setShowWarning(false);
              setHasConsented(true);
              handleSendEmail();
            }}>I Understand, Proceed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmailProvider;
