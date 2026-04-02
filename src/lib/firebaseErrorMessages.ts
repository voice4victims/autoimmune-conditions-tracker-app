const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please try another method.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'auth/credential-already-in-use': 'This credential is already associated with another account.',
  'auth/invalid-action-code': 'This link has expired or already been used.',
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/missing-email': 'Please enter your email address.',
};

export function getFriendlyAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code in FIREBASE_ERROR_MAP) {
      return FIREBASE_ERROR_MAP[code];
    }
  }
  return 'Something went wrong. Please try again.';
}
