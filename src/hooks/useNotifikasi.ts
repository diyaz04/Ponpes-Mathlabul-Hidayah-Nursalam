import { useState, useEffect } from 'react';
import { Notifikasi } from '../types';
import { dbLocal } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useNotifikasi() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const reloadNotifications = () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const all = dbLocal.getNotifikasi();
    // Filter for current user's profile ID
    const mine = all.filter(n => n.user_id === user.id);
    setNotifications(mine);
    setUnreadCount(mine.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    reloadNotifications();

    // Listen to local store events simulating real-time updates
    const handleStoreChange = () => {
      reloadNotifications();
    };

    window.addEventListener('mh_local_store_change', handleStoreChange);
    window.addEventListener('mh_auth_change', handleStoreChange);

    return () => {
      window.removeEventListener('mh_local_store_change', handleStoreChange);
      window.removeEventListener('mh_auth_change', handleStoreChange);
    };
  }, [user]);

  const markAllAsRead = () => {
    if (!user) return;
    const all = dbLocal.getNotifikasi();
    const updated = all.map(n => n.user_id === user.id ? { ...n, is_read: true } : n);
    dbLocal.setNotifikasi(updated);
  };

  const markAsRead = (id: string) => {
    const all = dbLocal.getNotifikasi();
    const updated = all.map(n => n.id === id ? { ...n, is_read: true } : n);
    dbLocal.setNotifikasi(updated);
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    reloadNotifications
  };
}
