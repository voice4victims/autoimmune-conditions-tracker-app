import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, LogOut, Loader2, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { isRevenueCatAvailable } from '@/lib/revenuecat';
import SplashScreen from './SplashScreen';
import TrialOfferScreen from './TrialOfferScreen';
import ChildManager from './ChildManager';
import MedicalDisclaimer from './MedicalDisclaimer';
import SelfCareBanner from './SelfCareBanner';
import ChildProfileForm from './ChildProfileForm';
import HomeScreen from './HomeScreen';
import MoreMenu from './MoreMenu';

const LogScreen = lazy(() => import('./LogScreen'));
const TrendsScreen = lazy(() => import('./TrendsScreen'));
const RecordsScreen = lazy(() => import('./RecordsScreen'));
const EducationScreen = lazy(() => import('./EducationScreen'));
const CommunityScreen = lazy(() => import('./CommunityScreen'));
const SymptomChart = lazy(() => import('./SymptomChart'));
const SymptomHeatmap = lazy(() => import('./SymptomHeatmap'));
const TreatmentTracker = lazy(() => import('./TreatmentTracker'));
const NotesTracker = lazy(() => import('./NotesTracker'));
const MedicationReminders = lazy(() => import('./MedicationReminders'));
const SupplementRecipes = lazy(() => import('./SupplementRecipes'));
const VitalSignsTracker = lazy(() => import('./VitalSignsTracker'));
const SelfCareGuide = lazy(() => import('./SelfCareGuide'));
const DrugInteractionChecker = lazy(() => import('./DrugInteractionChecker'));
const ResourcesTab = lazy(() => import('./ResourcesTab'));
const FamilyManager = lazy(() => import('./FamilyManager').then(m => ({ default: m.FamilyManager })));
const AdvancedAnalyticsDashboard = lazy(() => import('./AdvancedAnalyticsDashboard'));
const DiagnosisTracker = lazy(() => import('./DiagnosisTracker').then(m => ({ default: m.DiagnosisTracker })));
const ProfileAndSecurity = lazy(() => import('./ProfileAndSecurity'));
const PatientProfile = lazy(() => import('./PatientProfile'));
const PrivacySettings = lazy(() => import('./PrivacySettings'));
const PTECTracker = lazy(() => import('./PTECTracker'));
const ProviderAccessManager = lazy(() => import('./ProviderAccessManager').then(m => ({ default: m.ProviderAccessManager })));
const FileManager = lazy(() => import('./FileManager'));
const ProviderTracker = lazy(() => import('./ProviderTracker'));
const EmailRecordsForm = lazy(() => import('./EmailRecordsForm'));
const MedicalVisitTracker = lazy(() => import('./MedicalVisitTracker'));
const InsuranceTracker = lazy(() => import('./InsuranceTracker'));
const AllergyTracker = lazy(() => import('./AllergyTracker'));
const MedicalRecordsScreen = lazy(() => import('./MedicalRecordsScreen'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const BetaProgram = lazy(() => import('./BetaProgram'));
import PaywallGate from './PaywallGate';

const LazyFallback = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
  </div>
);

type ScreenId = 'home' | 'log' | 'trends' | 'records' | 'more';

const NAV_TABS = [
  { id: 'home' as ScreenId, icon: '🏠', label: 'Home' },
  { id: 'log' as ScreenId, icon: '📋', label: 'Log' },
  { id: 'trends' as ScreenId, icon: '📈', label: 'Trends' },
  { id: 'records' as ScreenId, icon: '🗂️', label: 'Records' },
  { id: 'more' as ScreenId, icon: '⋯', label: 'More' },
];



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
  const { isPro, isTrialing, trialExpirationDate } = useSubscription();
  const atFreeLimit = isRevenueCatAvailable() && !isPro && children.length >= 1;

  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('pandas_splash_shown')
  );
  const [showTrialOffer, setShowTrialOffer] = useState(false);

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('pandas_splash_shown', '1');
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (
      !showSplash &&
      isRevenueCatAvailable() &&
      !isPro &&
      !isTrialing &&
      !sessionStorage.getItem('pandas_trial_shown')
    ) {
      setShowTrialOffer(true);
    }
  }, [showSplash, isPro, isTrialing]);

  const handleTrialDone = useCallback(() => {
    sessionStorage.setItem('pandas_trial_shown', '1');
    setShowTrialOffer(false);
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

  const trialDaysLeft = (() => {
    if (!isTrialing || !trialExpirationDate) return null;
    const days = Math.ceil((new Date(trialExpirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  })();

  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (showTrialOffer) {
    return <TrialOfferScreen onDone={handleTrialDone} />;
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] z-50" style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }} />
        <div
          className="px-5 py-4 pt-[calc(env(safe-area-inset-top)+16px)] flex items-center gap-3 sticky top-0 z-40"
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
            <h2 className="font-serif text-xl text-neutral-800 dark:text-neutral-100 mb-2">Create Child Profile</h2>
            <p className="font-sans text-[13px] text-neutral-500 dark:text-neutral-400">
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
      allergies: <AllergyTracker />,
      'drug-safety': <DrugInteractionChecker />,
      resources: <ResourcesTab />,
      family: <FamilyManager />,
      community: <CommunityScreen />,
      analytics: <PaywallGate feature="Advanced Analytics"><AdvancedAnalyticsDashboard /></PaywallGate>,
      diagnosis: <PaywallGate feature="Patient Profile"><DiagnosisTracker /></PaywallGate>,
      privacy: <PrivacySettings />,
      profile: (
        <ProfileAndSecurity
          showChildManager={showChildManager}
          setShowChildManager={setShowChildManager}
        />
      ),
      ptec: <PTECTracker />,
      'provider-access': <PaywallGate feature="Provider Access Links"><ProviderAccessManager /></PaywallGate>,
      providers: <PaywallGate feature="Healthcare Providers"><ProviderTracker /></PaywallGate>,
      files: <PaywallGate feature="Document Storage"><FileManager /></PaywallGate>,
      email: <PaywallGate feature="Email Records"><EmailRecordsForm /></PaywallGate>,
      insurance: <PaywallGate feature="Insurance Tracker"><InsuranceTracker /></PaywallGate>,
      'medical-visits': <PaywallGate feature="Medical Visits"><MedicalVisitTracker /></PaywallGate>,
      'medical-records': <PaywallGate feature="Medical Records"><MedicalRecordsScreen /></PaywallGate>,
      'privacy-policy': <PrivacyPolicy />,
      'terms-of-service': <TermsOfService />,
      comorbidities: <PaywallGate feature="Co-Morbidities"><PatientProfile /></PaywallGate>,
      'patient-profile': <PaywallGate feature="Patient Profile"><PatientProfile /></PaywallGate>,
      subscription: <PaywallGate feature="Pro Subscription"><div /></PaywallGate>,
      beta: <BetaProgram />,
    };

    return contentMap[activeMoreTab] || null;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col relative">
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-white dark:bg-neutral-900 z-50" />
      <div className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
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
            <div className="flex items-center gap-1.5">
              <p className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100 m-0">
                Tracking: {childProfile?.name ?? 'Select child'}
              </p>
              {trialDaysLeft !== null && (
                <span className="font-sans font-bold text-[10px] text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 rounded-md px-1.5 py-0.5 leading-none">
                  Trial: {trialDaysLeft}d left
                </span>
              )}
            </div>
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
              if (atFreeLimit) {
                setScreen('more');
                setActiveMoreTab('subscription');
              } else {
                setShowChildManager(true);
              }
            }}
            className={cn(
              'font-sans font-bold text-[11px] rounded-lg px-2.5 py-1 cursor-pointer border',
              atFreeLimit
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                : 'text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
            )}
          >
            {atFreeLimit ? (
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Add
              </span>
            ) : (
              '+ Add'
            )}
          </button>
          <button
            onClick={() => {
              setScreen('more');
              setActiveMoreTab('reminders');
            }}
            className="relative font-sans font-bold text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 cursor-pointer"
            aria-label="Medication Reminders"
          >
            <span aria-hidden="true">⏰</span>
          </button>
          <button
            onClick={() => {
              setScreen('more');
              setActiveMoreTab('profile');
            }}
            className="font-sans font-bold text-[11px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 cursor-pointer"
            aria-label="Profile and Settings"
          >
            <span aria-hidden="true">⚙️</span>
          </button>
          <button
            onClick={signOut}
            className="font-sans font-bold text-[11px] text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
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

        <Suspense fallback={<LazyFallback />}>
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

          {screen === 'more' && activeMoreTab === 'community' && (
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
              <CommunityScreen />
            </div>
          )}

          {screen === 'more' && activeMoreTab !== 'learn' && activeMoreTab !== 'community' && (
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
        </Suspense>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex justify-center pb-[env(safe-area-inset-bottom,8px)] pt-2 z-50" aria-label="Main navigation">
        {NAV_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setScreen(t.id);
              if (t.id === 'more') setActiveMoreTab(null);
              if (t.id === 'log') setLogTab('symptoms');
            }}
            className="w-16 flex flex-col items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            aria-label={t.label}
            aria-current={screen === t.id ? 'page' : undefined}
          >
            <span
              className={cn(
                'leading-none transition-all',
                screen === t.id ? 'text-[21px]' : 'text-[19px] opacity-40'
              )}
              aria-hidden="true"
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
              <div className="w-4 h-0.5 bg-primary-500 rounded-full" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      <ChildManager
        isOpen={showChildManager}
        onClose={() => setShowChildManager(false)}
        onNavigateToSubscription={() => {
          setScreen('more');
          setActiveMoreTab('subscription');
        }}
      />
    </div>
  );
};

export default AppLayout;
