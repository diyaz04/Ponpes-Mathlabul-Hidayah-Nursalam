import { useEffect, useRef } from 'react';

export function useRealtime(callback: () => void) {
  const latestCallback = useRef(callback);

  // Always keep the ref pointing to the latest callback function passed to the hook
  useEffect(() => {
    latestCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = () => {
      latestCallback.current();
    };

    // Invoke immediately on mount
    handler();

    // Bind local state changes and auth transitions
    window.addEventListener('mh_local_store_change', handler);
    window.addEventListener('mh_auth_change', handler);

    return () => {
      window.removeEventListener('mh_local_store_change', handler);
      window.removeEventListener('mh_auth_change', handler);
    };
  }, []); // Run only once on mount
}

