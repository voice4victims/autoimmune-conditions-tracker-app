import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SymptomRating, ChildProfile } from '@/types/pandas';
import { toast } from '@/components/ui/use-toast';
import { Mail } from 'lucide-react';

interface EmailChartProps {
  childProfile: ChildProfile;
}

const EmailChart: React.FC<EmailChartProps> = ({ childProfile }) => {
  const [doctorEmail, setDoctorEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const generateEmailContent = () => {
    const recentSymptoms = childProfile.symptoms.slice(-30); // Last 30 entries
    
    let emailBody = `PANDAS Symptom Report for ${childProfile.name}\n\n`;
    emailBody += `Date of Birth: ${childProfile.dateOfBirth}\n`;
    emailBody += `Report Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    if (recentSymptoms.length === 0) {
      emailBody += 'No symptoms recorded in the past 30 entries.\n';
    } else {
      emailBody += 'Recent Symptom History:\n';
      emailBody += '========================\n\n';
      
      recentSymptoms.forEach((symptom) => {
        emailBody += `Date: ${symptom.date}\n`;
        emailBody += `Symptom: ${symptom.symptomType}\n`;
        emailBody += `Severity: ${symptom.severity}/10\n`;
        if (symptom.notes) {
          emailBody += `Notes: ${symptom.notes}\n`;
        }
        emailBody += '\n';
      });
    }
    
    if (message) {
      emailBody += `\nAdditional Message:\n${message}\n`;
    }
    
    return emailBody;
  };

  const handleSendEmail = () => {
    if (!doctorEmail) {
      toast({ title: 'Error', description: 'Please enter doctor\'s email address' });
      return;
    }

    const subject = `PANDAS Symptom Report - ${childProfile.name}`;
    const body = generateEmailContent();
    
    const mailtoLink = `mailto:${doctorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink);
    toast({ title: 'Success', description: 'Email client opened with symptom report' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Report to Doctor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="doctorEmail">Doctor's Email</Label>
          <Input
            id="doctorEmail"
            type="email"
            value={doctorEmail}
            onChange={(e) => setDoctorEmail(e.target.value)}
            placeholder="doctor@example.com"
          />
        </div>
        
        <div>
          <Label htmlFor="message">Additional Message (Optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any additional information for the doctor..."
            rows={3}
          />
        </div>
        
        <Button onClick={handleSendEmail} className="w-full">
          <Mail className="w-4 h-4 mr-2" />
          Send Email Report
        </Button>
        
        <div className="text-sm text-gray-600">
          <p>This will open your default email client with a pre-filled message containing:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Child's basic information</li>
            <li>Recent symptom history (last 30 entries)</li>
            <li>Severity ratings and notes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailChart;