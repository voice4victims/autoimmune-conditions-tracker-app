import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { isRevenueCatAvailable } from '@/lib/revenuecat';
import UpgradeBanner from './UpgradeBanner';

const MORE_ITEMS = [
  { i: '☕', l: 'Self Care', s: 'Wellness tips & guidance', id: 'selfcare', nav: true },
  { i: '📚', l: 'Learn About PANS', s: 'Knowledge hub & education', id: 'learn', nav: true },
  { i: '❤️', l: 'Vital Signs', s: 'Temperature, heart rate, etc.', id: 'vitals', nav: true },
  { i: '💊', l: 'Treatments', s: 'Log medications & therapies', id: 'treatments', nav: true },
  { i: '⏰', l: 'Reminders', s: 'Medication reminders', id: 'reminders', nav: true },
  { i: '🍳', l: 'Recipes', s: 'Supplement & meal recipes', id: 'recipes', nav: true },
  { i: '📝', l: 'Notes', s: 'Daily observations', id: 'notes', nav: true },
  { i: '📈', l: 'History', s: 'Symptom charts & trends', id: 'history', nav: true },
  { i: '🗓️', l: 'Heatmap', s: 'Visual symptom calendar', id: 'heatmap', nav: true },
  { i: '👨‍⚕️', l: 'Providers', s: 'Your healthcare providers', id: 'providers', nav: true, pro: true },
  { i: '📁', l: 'Files', s: 'Upload documents', id: 'files', nav: true, pro: true },
  { i: '📧', l: 'Email Records', s: 'Send records to doctor', id: 'email', nav: true, pro: true },
  { i: '🤧', l: 'Allergies', s: 'Track allergy records', id: 'allergies', nav: true },
  { i: '🛡️', l: 'Drug Safety', s: 'Check interactions', id: 'drug-safety', nav: true },
  { i: '🪪', l: 'Insurance', s: 'Store insurance info', id: 'insurance', nav: false, pro: true },
  { i: '🏥', l: 'Medical Visits', s: 'Doctor visits & notes', id: 'medical-visits', nav: true, pro: true },
  { i: '🗃️', l: 'Medical Records', s: 'Lab results, imaging & documents', id: 'medical-records', nav: true, pro: true },
  { i: '👨‍👩‍👧', l: 'Family', s: 'Manage caregivers', id: 'family', nav: true },
  { i: '🌍', l: 'Community', s: 'Find PANDAS doctors worldwide', id: 'community', nav: true },
  { i: '📋', l: 'Analytics', s: 'Advanced treatment analysis', id: 'analytics', nav: true, pro: true },
  { i: '🧬', l: 'Patient Profile', s: 'Infection, onset, diagnosis', id: 'diagnosis', nav: true, pro: true },
  { i: '🩻', l: 'Co-Morbidities', s: 'Prior & post-infection conditions', id: 'comorbidities', nav: false, pro: true },
  { i: '🔐', l: 'Account & Privacy', s: 'Logout, data & permissions', id: 'privacy', nav: true },
  { i: '📜', l: 'Privacy Policy & HIPAA', s: 'Notice of Privacy Practices', id: 'privacy-policy', nav: true },
  { i: '📃', l: 'Terms of Service', s: 'Usage terms & conditions', id: 'terms-of-service', nav: true },
  { i: '👤', l: 'Profile & Settings', s: 'Child profile & app settings', id: 'profile', nav: true },
];

const FAQ_ITEMS = [
  {
    q: 'What is the difference between PANS and PANDAS?',
    a: 'PANDAS is a specific subset of PANS where symptoms are triggered by Group A Streptococcal (GAS) infection. PANS has a broader definition and can be triggered by other infections, metabolic disturbances, or inflammatory reactions.',
  },
  {
    q: 'How quickly can PANS/PANDAS symptoms appear?',
    a: 'The hallmark of PANS/PANDAS is sudden, dramatic onset — often appearing overnight or within 24-48 hours. This rapid onset helps distinguish it from other psychiatric conditions.',
  },
  {
    q: 'Can PANDAS be triggered without a sore throat?',
    a: 'Yes. Group A Strep can infect the perianal area, skin, or sinuses without causing a classic sore throat. Symptoms can also appear weeks after an infection that seemed to resolve.',
  },
  {
    q: 'What lab tests are useful for PANS/PANDAS?',
    a: 'ASO titer, Anti-DNase B, throat culture, and the Cunningham Panel are commonly used. CBC, CRP, ANA, and Mycoplasma titers may also provide useful information.',
  },
  {
    q: 'When is IVIG recommended?',
    a: "IVIG is a treatment that some specialists may discuss with families when other approaches haven't been effective. It's a significant step — talk to your child's doctor or specialist to understand whether it may be appropriate for your situation.",
  },
  {
    q: 'How do I find a PANDAS-literate doctor?',
    a: 'Use the PANDAS Physicians Network (ppnnetwork.com) and PANDAS Network provider directory. The Community screen in this app also lists recommended providers.',
  },
  {
    q: 'Is this app a substitute for medical care?',
    a: 'No. This app is for symptom tracking and information only. Always consult qualified healthcare professionals for diagnosis and treatment decisions.',
  },
];

interface MoreMenuProps {
  activeMoreTab: string | null;
  onMoreTabClick: (tab: string) => void;
  onBackToMenu: () => void;
}

const PREMIUM_IDS = new Set(MORE_ITEMS.filter((m) => (m as any).pro).map((m) => m.id));

const MoreMenu: React.FC<MoreMenuProps> = ({ activeMoreTab, onMoreTabClick, onBackToMenu }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { isPro } = useSubscription();
  const showProBadges = isRevenueCatAvailable() && !isPro;

  if (activeMoreTab) {
    return (
      <div className="mb-4">
        <button
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 font-sans font-bold text-[13px] text-primary-600 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div>
      <UpgradeBanner onUpgrade={() => onMoreTabClick('subscription')} />

      <div className="grid grid-cols-2 gap-2.5 mb-6 mt-3">
        {MORE_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onMoreTabClick(item.id)}
            className="relative flex items-center gap-2.5 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left cursor-pointer transition-colors"
          >
            <span className="text-lg shrink-0">{item.i}</span>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-extrabold text-[12px] text-neutral-700 dark:text-neutral-200 m-0 truncate">
                {item.l}
              </p>
              <p className="font-sans text-[10px] text-neutral-400 m-0 truncate">{item.s}</p>
            </div>
            {showProBadges && PREMIUM_IDS.has(item.id) ? (
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : item.nav ? (
              <span className="text-neutral-300 text-xs shrink-0">›</span>
            ) : null}
          </button>
        ))}
      </div>

      <p className="font-sans font-extrabold text-[11px] text-neutral-500 uppercase tracking-[0.07em] mb-3">
        Frequently Asked Questions
      </p>
      <div className="space-y-2">
        {FAQ_ITEMS.map((faq, i) => (
          <Card key={i} className="overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex justify-between items-start gap-3 p-4 text-left cursor-pointer bg-transparent border-none"
            >
              <span className="font-sans font-bold text-[13px] text-neutral-700 dark:text-neutral-200 leading-snug">
                {faq.q}
              </span>
              <span
                className={cn(
                  'text-neutral-400 text-lg shrink-0 transition-transform',
                  openFaq === i ? 'rotate-45' : ''
                )}
              >
                +
              </span>
            </button>
            {openFaq === i && (
              <div className="px-4 pb-4">
                <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                  {faq.a}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MoreMenu;
