import { useEffect, useState } from 'react';
import { Notifikasi } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useNotifikasi() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const reloadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from('notifikasi')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Notifikasi Load Failure]', error);
      return;
    }

    const mine = (data || []) as Notifikasi[];
    setNotifications(mine);
    setUnreadCount(mine.filter(n => !n.is_read).length);
  };

  useEffect(() => {
    reloadNotifications();

    if (!user) return;

    const uniqueChannelName = `notifikasi:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifikasi', filter: `user_id=eq.${user.id}` },
        () => reloadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifikasi')
      .update({ is_read: true })
      .eq('user_id', user.id);
    if (error) console.error('[Supabase Notifikasi Update Failure]', error);
    await reloadNotifications();
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifikasi')
      .update({ is_read: true })
      .eq('id', id);
    if (error) console.error('[Supabase Notifikasi Update Failure]', error);
    await reloadNotifications();
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    reloadNotifications
  };
}
