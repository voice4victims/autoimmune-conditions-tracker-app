import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Capacitor } from '@capacitor/core';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import { isBiometricAvailable, isBiometricEnabled, getBiometryType } from '@/lib/biometricService';
import { getFriendlyAuthError } from '@/lib/firebaseErrorMessages';
import PasswordStrengthMeter, { validatePasswordForSignup } from '@/components/PasswordStrengthMeter';

const CONSENT_VERSION = '1.0';

async function getConsentRecord(uid: string) {
  const snap = await getDoc(doc(db, 'user_consents', uid));
  return snap.exists() ? snap.data() : null;
}

async function saveConsentRecord(uid: string) {
  await setDoc(doc(db, 'user_consents', uid), {
    parentConsent: true,
    hipaaConsent: true,
    consentVersion: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

const AuthForm: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const { signInWithBiometrics } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentConsent, setParentConsent] = useState(false);
  const [hipaaConsent, setHipaaConsent] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showReconsentModal, setShowReconsentModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [reconsentParent, setReconsentParent] = useState(false);
  const [reconsentHipaa, setReconsentHipaa] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const auth = getAuth();

  const isOver18 = (() => {
    if (!dateOfBirth) return false;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    return age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && today.getDate() >= dob.getDate())));
  })();
  const consentGiven = parentConsent && hipaaConsent && isOver18;
  const passwordValid = !isSignUp || validatePasswordForSignup(password) === null;
  const signUpBlocked = isSignUp && (!consentGiven || !passwordValid);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = available && await isBiometricEnabled();
      setBiometricReady(enabled);
      if (enabled) setBiometricLabel(await getBiometryType());
    })();
  }, []);

  const checkConsentAndProceed = async (user: User) => {
    try {
      const record = await getConsentRecord(user.uid);
      if (record && record.consentVersion === CONSENT_VERSION) {
        onAuthSuccess();
        return;
      }
      setPendingUser(user);
      setShowReconsentModal(true);
    } catch {
      onAuthSuccess();
    }
  };

  const handleReconsentConfirm = async () => {
    if (!pendingUser || !reconsentParent || !reconsentHipaa) return;
    await saveConsentRecord(pendingUser.uid);
    setShowReconsentModal(false);
    setPendingUser(null);
    onAuthSuccess();
  };

  const handleBiometricSignIn = async () => {
    setError(null);
    try {
      const success = await signInWithBiometrics();
      if (success && auth.currentUser) {
        await checkConsentAndProceed(auth.currentUser);
      } else {
        setError('Biometric authentication failed. Please sign in with your credentials.');
      }
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignUp) {
      const validationError = validatePasswordForSignup(password);
      if (validationError) {
        setError(`Password requirement not met: ${validationError}`);
        return;
      }
    }
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await saveConsentRecord(result.user.uid);
        onAuthSuccess();
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        await checkConsentAndProceed(result.user);
      }
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    }
  };

  const signInWithProvider = async (provider: GoogleAuthProvider | OAuthProvider) => {
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(auth, provider);
    } else {
      const result = await signInWithPopup(auth, provider);
      if (isSignUp) {
        await saveConsentRecord(result.user.uid);
        onAuthSuccess();
      } else {
        await checkConsentAndProceed(result.user);
      }
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          const record = await getConsentRecord(result.user.uid);
          if (record && record.consentVersion === CONSENT_VERSION) {
            onAuthSuccess();
          } else {
            setPendingUser(result.user);
            setShowReconsentModal(true);
          }
        }
      }).catch((err: unknown) => setError(getFriendlyAuthError(err)));
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithProvider(provider);
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithProvider(provider);
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err));
    }
  };

  const consentCheckboxes = (
    <div className="space-y-2.5">
      <div className="p-3 rounded-xl border border-primary-200 bg-primary-50/50">
        <label className="font-sans text-[12px] text-neutral-600 font-semibold block mb-1.5">Your date of birth</label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 rounded-lg border border-primary-200 text-sm bg-white"
        />
        {dateOfBirth && !isOver18 && (
          <p className="text-[11px] text-red-600 mt-1">You must be 18 or older to create an account.</p>
        )}
      </div>
      <label className="flex items-start gap-2.5 p-3 rounded-xl border border-primary-200 bg-primary-50/50 cursor-pointer">
        <input
          type="checkbox"
          checked={parentConsent}
          onChange={(e) => setParentConsent(e.target.checked)}
          className="mt-0.5 accent-primary-600 w-4 h-4 shrink-0"
        />
        <span className="font-sans text-[12px] text-neutral-600 leading-relaxed">
          I am a <strong>parent or legal guardian</strong> (18 years or older) and I am creating this account to track my child's health information. I understand this app is <strong>not a medical device</strong> and does not provide medical advice.
        </span>
      </label>
      <label className="flex items-start gap-2.5 p-3 rounded-xl border border-primary-200 bg-primary-50/50 cursor-pointer">
        <input
          type="checkbox"
          checked={hipaaConsent}
          onChange={(e) => setHipaaConsent(e.target.checked)}
          className="mt-0.5 accent-primary-600 w-4 h-4 shrink-0"
        />
        <span className="font-sans text-[12px] text-neutral-600 leading-relaxed">
          I acknowledge that health data entered into this app is <strong>Protected Health Information (PHI)</strong> under HIPAA. I have reviewed and agree to the{' '}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowPrivacyPolicy(true); }}
            className="text-primary-600 underline font-bold bg-transparent border-none cursor-pointer p-0 inline"
          >
            Privacy Policy & Notice of Privacy Practices
          </button>.
        </span>
      </label>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto px-6">
      <div className="text-center mb-8">
        <img
          src="/owl-mascot.png"
          alt="PANDAS Tracker"
          className="w-20 h-20 mx-auto mb-4 object-contain"
          style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.15))' }}
        />
        <p
          className="font-sans font-extrabold text-[10px] tracking-[0.18em] uppercase mb-1"
          style={{ color: 'rgba(91,210,220,0.85)' }}
        >
          SPM HealthTech
        </p>
        <h1 className="font-serif text-[28px] text-white mb-1 leading-tight">PANDAS Tracker</h1>
        <p className="font-sans text-[13px] text-white/50">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-3">
            <p className="font-sans text-[12px] text-danger-500 m-0">{error}</p>
          </div>
        )}

        {isSignUp && consentCheckboxes}

        <form onSubmit={handleEmailPasswordAuth} className="space-y-3">
          <div>
            <Label className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Email
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-neutral-500">
              Password
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
            {isSignUp && <PasswordStrengthMeter password={password} />}
          </div>
          <Button
            type="submit"
            className="w-full font-sans font-bold"
            style={{ background: signUpBlocked ? '#ccc' : 'linear-gradient(135deg, #176F91, #573F9E)' }}
            disabled={signUpBlocked}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 font-sans text-[11px] text-neutral-400 uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleGoogleSignIn}
            type="button"
            disabled={signUpBlocked}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white font-sans font-bold text-[13px] text-neutral-700 transition-colors ${signUpBlocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-50 cursor-pointer'}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
          <button
            onClick={handleAppleSignIn}
            type="button"
            disabled={signUpBlocked}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white font-sans font-bold text-[13px] text-neutral-700 transition-colors ${signUpBlocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-50 cursor-pointer'}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Sign in with Apple
          </button>
        </div>

        {biometricReady && (
          <button
            onClick={handleBiometricSignIn}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 cursor-pointer font-sans font-bold text-[13px] text-primary-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10a2 2 0 0 0-2 2c0 1.02.1 2.51.4 4" />
              <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
              <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M2 16h.01" />
              <path d="M21.8 16c.2-2 .131-5.354 0-6" />
              <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
              <path d="M8.65 22c.21-.66.45-1.32.57-2" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
            </svg>
            Sign in with {biometricLabel}
          </button>
        )}

        <p className="text-center font-sans text-[13px] text-neutral-500 pt-1">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setParentConsent(false); setHipaaConsent(false); }}
            className="font-bold text-primary-500 bg-transparent border-none cursor-pointer p-0"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>

      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPrivacyPolicy(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4 flex justify-between items-center">
              <h2 className="font-serif text-lg font-bold text-neutral-800 dark:text-neutral-100">Privacy Policy & Notice of Privacy Practices</h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-neutral-500 hover:text-neutral-700 bg-transparent border-none cursor-pointer text-xl font-bold p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <PrivacyPolicy />
          </div>
        </div>
      )}

      {showReconsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-neutral-800">Updated Privacy Policy</h2>
            <p className="font-sans text-[13px] text-neutral-600">
              Our Privacy Policy has been updated. Please review and accept before continuing.
            </p>
            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-primary-200 bg-primary-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconsentParent}
                  onChange={(e) => setReconsentParent(e.target.checked)}
                  className="mt-0.5 accent-primary-600 w-4 h-4 shrink-0"
                />
                <span className="font-sans text-[12px] text-neutral-600 leading-relaxed">
                  I am a <strong>parent or legal guardian</strong> (18 years or older) and I confirm this account is used to track my child's health information.
                </span>
              </label>
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-primary-200 bg-primary-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reconsentHipaa}
                  onChange={(e) => setReconsentHipaa(e.target.checked)}
                  className="mt-0.5 accent-primary-600 w-4 h-4 shrink-0"
                />
                <span className="font-sans text-[12px] text-neutral-600 leading-relaxed">
                  I acknowledge that health data in this app is <strong>Protected Health Information (PHI)</strong> under HIPAA and I agree to the updated{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-primary-600 underline font-bold bg-transparent border-none cursor-pointer p-0 inline"
                  >
                    Privacy Policy & Notice of Privacy Practices
                  </button>.
                </span>
              </label>
            </div>
            <Button
              onClick={handleReconsentConfirm}
              disabled={!reconsentParent || !reconsentHipaa}
              className="w-full font-sans font-bold"
              style={{ background: (!reconsentParent || !reconsentHipaa) ? '#ccc' : 'linear-gradient(135deg, #176F91, #573F9E)' }}
            >
              Accept & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
