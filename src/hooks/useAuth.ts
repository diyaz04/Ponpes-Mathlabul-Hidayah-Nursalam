import { useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { dbLocal } from '../lib/supabase';

// Helper to keep active session role for testing
const SESSION_KEY = 'mh_auth_session_user_id';

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize active user
  useEffect(() => {
    const profiles = dbLocal.getProfiles();
    const storedUserId = localStorage.getItem(SESSION_KEY);
    
    if (storedUserId) {
      const currentUser = profiles.find(p => p.id === storedUserId) || null;
      setUser(currentUser);
    } else {
      setUser(null);
    }
    setLoading(false);

    // Sync other components during role switches
    const handleAuthChange = () => {
      const refreshedProfiles = dbLocal.getProfiles();
      const updatedUserId = localStorage.getItem(SESSION_KEY);
      const updatedUser = updatedUserId ? (refreshedProfiles.find(p => p.id === updatedUserId) || null) : null;
      setUser(updatedUser);
    };

    window.addEventListener('mh_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('mh_auth_change', handleAuthChange);
    };
  }, []);

  const login = (role: UserRole, customUserId?: string) => {
    setLoading(true);
    const profiles = dbLocal.getProfiles();
    
    // Choose selected user or matching role matching user
    let selectedUser = profiles.find(p => p.id === customUserId);
    if (!selectedUser) {
      selectedUser = profiles.find(p => p.role === role);
    }

    if (selectedUser) {
      localStorage.setItem(SESSION_KEY, selectedUser.id);
      setUser(selectedUser);
      window.dispatchEvent(new Event('mh_auth_change'));
    }
    setLoading(false);
  };

  const logout = () => {
    setLoading(true);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.dispatchEvent(new Event('mh_auth_change'));
    setLoading(false);
  };

  const switchRole = (role: UserRole) => {
    const list = dbLocal.getProfiles();
    const target = list.find(p => p.role === role);
    if (target) {
      login(role, target.id);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    switchRole,
    allProfiles: dbLocal.getProfiles()
  };
}
