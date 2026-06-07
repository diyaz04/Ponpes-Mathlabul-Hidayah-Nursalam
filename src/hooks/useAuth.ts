import { useEffect, useState } from 'react';
import { Profile, UserRole } from '../types';
import { getCurrentProfile, supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    setLoading(true);
    try {
      const profile = await getCurrentProfile();
      setUser(profile);
    } catch (error) {
      console.error('[Supabase Profile Load Failure]', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();

    const { data } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (_role: UserRole, email?: string, password?: string) => {
    if (!email || !password) {
      throw new Error('Email dan password wajib diisi.');
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (_role: UserRole) => {
    console.warn('[Supabase Auth] switchRole dinonaktifkan. Login dengan akun Supabase sesuai role.');
  };

  return {
    user,
    loading,
    login,
    logout,
    switchRole,
    allProfiles: [] as Profile[]
  };
}
