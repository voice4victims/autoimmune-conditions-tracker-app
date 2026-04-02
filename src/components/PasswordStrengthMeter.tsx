import React from 'react';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

function getRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrength(requirements: PasswordRequirement[]): { score: number; label: string; color: string; barColor: string } {
  const met = requirements.filter((r) => r.met).length;
  if (met <= 1) return { score: met, label: 'Very weak', color: 'text-red-600', barColor: 'bg-red-500' };
  if (met === 2) return { score: met, label: 'Weak', color: 'text-orange-600', barColor: 'bg-orange-500' };
  if (met === 3) return { score: met, label: 'Fair', color: 'text-yellow-600', barColor: 'bg-yellow-500' };
  if (met === 4) return { score: met, label: 'Good', color: 'text-blue-600', barColor: 'bg-blue-500' };
  return { score: met, label: 'Strong', color: 'text-green-600', barColor: 'bg-green-500' };
}

export function validatePasswordForSignup(password: string): string | null {
  const reqs = getRequirements(password);
  const unmet = reqs.filter((r) => !r.met);
  if (unmet.length === 0) return null;
  return unmet[0].label;
}

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;

  const requirements = getRequirements(password);
  const strength = getStrength(requirements);

  return (
    <div className="space-y-2 mt-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= strength.score ? strength.barColor : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
        <span className={`font-sans text-[11px] font-semibold ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      <ul className="space-y-0.5">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-1.5">
            {req.met ? (
              <svg className="w-3 h-3 text-green-500 shrink-0" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-neutral-400 shrink-0" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
            <span className={`font-sans text-[11px] ${req.met ? 'text-green-600' : 'text-neutral-500'}`}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
