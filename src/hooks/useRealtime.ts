import { useEffect, useRef } from 'react';
import { refreshSupabaseCache, supabase } from '../lib/supabase';

export function useRealtime(callback: () => void | Promise<void>, tables: string[] = []) {
  const latestCallback = useRef(callback);

  useEffect(() => {
    latestCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    refreshSupabaseCache()
      .catch((error) => console.error('[Supabase Realtime Cache Failure]', error))
      .finally(() => latestCallback.current());

    if (tables.length === 0) {
      return;
    }

    const uniqueChannelName = `realtime:${tables.join(':')}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(uniqueChannelName);
    tables.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        refreshSupabaseCache()
          .catch((error) => console.error('[Supabase Realtime Cache Failure]', error))
          .finally(() => latestCallback.current());
      });
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables.join(':')]);
}
