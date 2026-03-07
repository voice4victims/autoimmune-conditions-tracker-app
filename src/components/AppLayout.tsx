import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import SplashScreen from './SplashScreen';
import MedicalDisclaimer from './MedicalDisclaimer';
import SelfCareBanner from './SelfCareBanner';
import ChildProfileForm from './ChildProfileForm';
import HomeScreen from './HomeScreen';
import LogScreen from './LogScreen';
import TrendsScreen from './TrendsScreen';
import RecordsScreen from './RecordsScreen';
import EducationScreen from './EducationScreen';
import MoreMenu from './MoreMenu';
import SymptomChart from './SymptomChart';
import SymptomHeatmap from './SymptomHeatmap';
import TreatmentTracker from './TreatmentTracker';
import NotesTracker from './NotesTracker';
import MedicationReminders from './MedicationReminders';
import SupplementRecipes from './SupplementRecipes';
import VitalSignsTracker from './VitalSignsTracker';
import SelfCareGuide from './SelfCareGuide';
import DrugInteractionChecker from './DrugInteractionChecker';
import ResourcesTab from './ResourcesTab';
import { FamilyManager } from './FamilyManager';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import { DiagnosisTracker } from './DiagnosisTracker';
import ProfileAndSecurity from './ProfileAndSecurity';
import PrivacySettings from './PrivacySettings';
import PTECTracker from './PTECTracker';
import { ProviderAccessManager } from './ProviderAccessManager';
import FileManager from './FileManager';
import ProviderTracker from './ProviderTracker';
import EmailRecordsForm from './EmailRecordsForm';
import MedicalVisitTracker from './MedicalVisitTracker';

type ScreenId = 'home' | 'log' | 'trends' | 'records' | 'more';

const NAV_TABS = [
  { id: 'home' as ScreenId, icon: '🏠', label: 'Home' },
  { id: 'log' as ScreenId, icon: '📋', label: 'Log' },
  { id: 'trends' as ScreenId, icon: '📈', label: 'Trends' },
  { id: 'records' as ScreenId, icon: '🗂️', label: 'Records' },
  { id: 'more' as ScreenId, icon: '⋯', label: 'More' },
];

const CommunityPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-4xl mb-3">🌍</p>
    <p className="font-serif text-xl text-neutral-700 mb-2">Community Provider Map</p>
    <p className="font-sans text-[13px] text-neutral-400 leading-relaxed px-4">
      Find PANDAS-literate doctors worldwide. Community-curated and updated. Coming soon.
    </p>
  </div>
);

const InsurancePlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-4xl mb-3">🪪</p>
    <p className="font-serif text-xl text-neutral-700 mb-2">Insurance Info</p>
    <p className="font-sans text-[13px] text-neutral-400 leading-relaxed px-4">
      Store your insurance details, policy numbers, and pre-authorization information. Coming soon.
    </p>
  </div>
);

const ComorbidPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-4xl mb-3">🩻</p>
    <p className="font-serif text-xl text-neutral-700 mb-2">Co-Morbidities</p>
    <p className="font-sans text-[13px] text-neutral-400 leading-relaxed px-4">
      Track prior and post-infection conditions, co-occurring diagnoses, and related health history. Coming soon.
    </p>
  </div>
);

const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    childProfile,
    children,
    setChildProfile,
    saveChildProfile,
  } = useApp();

  const [screen, setScreen] = useState<ScreenId>('home');
  const [logTab, setLogTab] = useState('symptoms');
  const [recordsTab, setRecordsTab] = useState('files');
  const [activeMoreTab, setActiveMoreTab] = useState<string | null>(null);
  const [showChildManager, setShowChildManager] = useState(false);
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('pandas_splash_shown')
  );

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('pandas_splash_shown', '1');
    setShowSplash(false);
  }, []);

  const handleChildSelect = (childId: string) => {
    const selected = children.find((c) => c.id === childId);
    if (selected) setChildProfile(selected);
  };

  const switchChild = () => {
    if (children.length <= 1) return;
    const currentIdx = children.findIndex((c) => c.id === childProfile?.id);
    const nextIdx = (currentIdx + 1) % children.length;
    setChildProfile(children[nextIdx]);
  };

  const handleNavigate = (target: string) => {
    if (target === 'home' || target === 'log' || target === 'trends' || target === 'records' || target === 'more') {
      setScreen(target as ScreenId);
      if (target === 'more') setActiveMoreTab(null);
      return;
    }

    if (target.startsWith('log-')) {
      const sub = target.replace('log-', '');
      setScreen('log');
      setLogTab(sub);
      return;
    }

    if (target.startsWith('records-')) {
      setScreen('records');
      setRecordsTab(target.replace('records-', ''));
      return;
    }

    if (target.startsWith('more-')) {
      setScreen('more');
      setActiveMoreTab(target.replace('more-', ''));
      return;
    }

    setScreen('more');
    setActiveMoreTab(target);
  };

  const handleMoreTabClick = (tab: string) => {
    setActiveMoreTab(tab);
  };

  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }}
        >
          <img
            src="/owl-mascot.png"
            alt="PANDAS Tracker"
            className="w-10 h-10 object-contain shrink-0"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
          />
          <div>
            <p className="font-sans font-extrabold text-[10px] tracking-[0.12em] uppercase text-white/55 m-0 mb-0.5">
              SPM HealthTech
            </p>
            <h1 className="font-serif text-[22px] text-white m-0">PANDAS Tracker</h1>
          </div>
        </div>
        <div className="max-w-lg mx-auto p-4 pt-6">
          <MedicalDisclaimer />
          <div className="text-center mb-6 mt-2">
            <h2 className="font-serif text-xl text-neutral-800 mb-2">Create Child Profile</h2>
            <p className="font-sans text-[13px] text-neutral-500">
              Start by creating a profile for your child to begin tracking
            </p>
          </div>
          <ChildProfileForm onCreateProfile={saveChildProfile} />
        </div>
      </div>
    );
  }

  const renderMoreContent = () => {
    if (!activeMoreTab) return null;

    const contentMap: Record<string, React.ReactNode> = {
      selfcare: <SelfCareGuide />,
      learn: <EducationScreen />,
      vitals: <VitalSignsTracker />,
      treatments: <TreatmentTracker />,
      reminders: <MedicationReminders />,
      recipes: <SupplementRecipes />,
      notes: <NotesTracker />,
      history: <SymptomChart />,
      heatmap: <SymptomHeatmap />,
      'drug-safety': <DrugInteractionChecker />,
      resources: <ResourcesTab />,
      family: <FamilyManager />,
      community: <CommunityPlaceholder />,
      analytics: <AdvancedAnalyticsDashboard />,
      diagnosis: <DiagnosisTracker />,
      privacy: <PrivacySettings />,
      profile: (
        <ProfileAndSecurity
          showChildManager={showChildManager}
          setShowChildManager={setShowChildManager}
        />
      ),
      ptec: <PTECTracker />,
      'provider-access': <ProviderAccessManager />,
      providers: <ProviderTracker />,
      files: <FileManager />,
      email: <EmailRecordsForm />,
      insurance: <InsurancePlaceholder />,
      'medical-records': <MedicalVisitTracker />,
      comorbidities: <ComorbidPlaceholder />,
    };

    return contentMap[activeMoreTab] || null;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col relative">
      <MedicalDisclaimer />
      <SelfCareBanner />

      <div className="bg-white dark:bg-neutral-900 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
            style={{ background: 'linear-gradient(135deg, #6BBCDB, #8A6DD2)' }}
          >
            👦
          </div>
          <div>
            <p className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100 m-0">
              Tracking: {childProfile?.name ?? 'Select child'}
            </p>
            <p className="font-sans text-[10px] text-neutral-400 m-0">Active profile</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {children.length > 1 && (
            <button
              onClick={switchChild}
              className="font-sans font-bold text-[11px] text-primary-500 bg-primary-50 dark:bg-primary-600/20 border border-primary-200 dark:border-primary-700 rounded-lg px-2.5 py-1 cursor-pointer"
            >
              Switch
            </button>
          )}
          <button
            onClick={() => {
              setScreen('more');
              setActiveMoreTab('profile');
            }}
            className="font-sans font-bold text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 cursor-pointer"
          >
            + Add
          </button>
          <button
            onClick={() => {
              setScreen('more');
              setActiveMoreTab('profile');
            }}
            className="font-sans font-bold text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 cursor-pointer"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {screen === 'home' && (
          <HomeScreen
            onQuickLog={() => {
              setScreen('log');
              setLogTab('symptoms');
            }}
            onNavigate={handleNavigate}
          />
        )}

        {screen === 'log' && <LogScreen initialTab={logTab} />}

        {screen === 'trends' && <TrendsScreen onOpenMore={(tab) => handleNavigate(`more-${tab}`)} />}

        {screen === 'records' && <RecordsScreen initialTab={recordsTab} />}

        {screen === 'more' && activeMoreTab === 'learn' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4 pb-2 shrink-0">
              <button
                onClick={() => setActiveMoreTab(null)}
                className="inline-flex items-center gap-2 font-sans font-bold text-[13px] text-primary-600 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Menu
              </button>
            </div>
            <EducationScreen />
          </div>
        )}

        {screen === 'more' && activeMoreTab !== 'learn' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {!activeMoreTab && (
              <div className="bg-white dark:bg-neutral-900 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-neutral-400 mb-0.5">
                  All features
                </p>
                <h2 className="font-serif text-[22px] text-neutral-800 dark:text-neutral-100 m-0 tracking-[-0.2px]">
                  More
                </h2>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              <MoreMenu
                activeMoreTab={activeMoreTab}
                onMoreTabClick={handleMoreTabClick}
                onBackToMenu={() => setActiveMoreTab(null)}
              />
              {renderMoreContent()}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex pb-[env(safe-area-inset-bottom,8px)] pt-2 z-50">
        {NAV_TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              setScreen(t.id);
              if (t.id === 'more') setActiveMoreTab(null);
              if (t.id === 'log') setLogTab('symptoms');
            }}
            className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer"
          >
            <span
              className={cn(
                'leading-none transition-all',
                screen === t.id ? 'text-[21px]' : 'text-[19px] opacity-40'
              )}
            >
              {t.icon}
            </span>
            <span
              className={cn(
                'font-sans text-[10px]',
                screen === t.id
                  ? 'font-extrabold text-primary-500'
                  : 'font-semibold text-neutral-400'
              )}
            >
              {t.label}
            </span>
            {screen === t.id && (
              <div className="w-4 h-0.5 bg-primary-500 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppLayout;
