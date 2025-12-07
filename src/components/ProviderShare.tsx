import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, MessageSquare, Link, Check } from 'lucide-react';
import { UnifiedProvider } from '@/types/provider';

interface ProviderShareProps {
  provider: UnifiedProvider;
}

const ProviderShare: React.FC<ProviderShareProps> = ({ provider }) => {
  const [copied, setCopied] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const shareText = `${provider.name} - ${provider.specialty}
Location: ${provider.location}
${provider.phone ? `Phone: ${provider.phone}` : ''}
${provider.website ? `Website: ${provider.website}` : ''}
${provider.pandasExpert ? 'PANDAS Expert ⭐' : ''}
${provider.rating ? `Rating: ${provider.rating}/5` : ''}

Treatments: ${provider.treatments?.join(', ') || 'N/A'}
${provider.telemedicine ? 'Telemedicine Available' : ''}
${provider.acceptsInsurance ? 'Accepts Insurance' : ''}
${provider.requiresReferral ? 'Referral Required' : ''}

Shared via PANDAS Health Tracker`;

  const shareUrl = `${window.location.origin}/provider/${provider.id}`;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const handleEmailShare = () => {
    const subject = `Provider Recommendation: ${provider.name}`;
    const body = `${emailMessage}\n\n${shareText}`;
    const mailtoUrl = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const handleSMSShare = () => {
    const smsText = `Check out this provider: ${provider.name} - ${provider.location}. ${shareUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(smsText)}`;
    window.open(smsUrl);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Provider Information</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">{provider.name}</span>
            {provider.pandasExpert && (
              <Badge className="bg-red-100 text-red-800 text-xs">PANDAS Expert</Badge>
            )}
          </div>
          <p className="text-gray-600">{provider.specialty}</p>
          <p className="text-gray-600">{provider.location}</p>
          {provider.phone && <p className="text-gray-600">{provider.phone}</p>}
          {provider.rating && (
            <p className="text-gray-600">Rating: {provider.rating}/5 ⭐</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Share Options</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Info'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            Copy Link
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleSMSShare}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Text Message
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Email to Someone</h4>
        
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Email</label>
          <Input
            type="email"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            placeholder="friend@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Personal Message (Optional)</label>
          <Textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            placeholder="I thought you might find this provider helpful..."
            rows={3}
          />
        </div>
        
        <Button 
          onClick={handleEmailShare}
          disabled={!emailRecipient}
          className="w-full flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      </div>

      <div className="text-xs text-gray-600 p-3 bg-blue-50 rounded-lg">
        <p><strong>Privacy Note:</strong> When sharing provider information, please respect patient privacy and only share with trusted individuals who may benefit from this information.</p>
      </div>
    </div>
  );
};

export default ProviderShare;