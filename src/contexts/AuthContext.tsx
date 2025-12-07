import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Default user object - no login required
const DEFAULT_USER: User = {
  id: 'default-user-123',
  email: 'user@pandastracker.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { name: 'PANDAS Tracker User' },
  aud: 'authenticated',
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: null,
  confirmation_sent_at: null,
  recovery_sent_at: null,
  email_change_sent_at: null,
  new_email: null,
  invited_at: null,
  action_link: null,
  phone: null,
  role: 'authenticated',
  last_sign_in_at: new Date().toISOString(),
  identities: []
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User | null>(DEFAULT_USER);
  const [loading] = useState(false);

  const signOut = async () => {
    // No-op since login is disabled
    console.log('Sign out requested - login is disabled');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};