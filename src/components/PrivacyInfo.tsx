
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, KeyRound, Siren } from 'lucide-react';

const PrivacyInfo: React.FC = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Privacy & Security Best Practices</h3>
      <p className="text-sm text-gray-600 mb-4">
        Protecting your account and your data is a shared responsibility. Here are some tips to keep your account secure:
      </p>
      <ul className="space-y-3 mb-4">
        <li className="flex items-start">
          <Lock className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-blue-600" />
          <span>
            <strong>Use a Strong Password:</strong> Combine uppercase and lowercase letters, numbers, and symbols to create a password that is difficult to guess.
          </span>
        </li>
        <li className="flex items-start">
          <ShieldCheck className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-green-600" />
          <span>
            <strong>Enable MFA:</strong> We strongly recommend enabling Multi-Factor Authentication. It adds a critical layer of security to your account.
          </span>
        </li>
        <li className="flex items-start">
          <Siren className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-red-600" />
          <span>
            <strong>Beware of Phishing:</strong> We will never ask for your password in an email. Be cautious of any unsolicited messages asking for your login credentials.
          </span>
        </li>
        <li className="flex items-start">
          <KeyRound className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-yellow-600" />
          <span>
            <strong>Secure Recovery Codes:</strong> If you enable MFA, store your recovery codes in a secure location, like a password manager.
          </span>
        </li>
      </ul>
        <Button variant="link" className="p-0">
          Read our full Privacy Policy
        </Button>
    </div>
  );
};

export default PrivacyInfo;
