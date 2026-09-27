import { useCallback, useState } from 'react';
import type { DonorSession } from '../../types';
import { safeRead, safeWrite } from '../../state/store/persistence';

const SESSION_KEY = 'irau-live:guest-session:v1';
const MINE_KEY = 'irau-live:guest-pledges:v1';

export interface MyPledge {
  id: string;
  amount: number;
  status: 'approved' | 'pending';
  at: number;
}

/** The guest's sign-in on this phone. Only a name and an opaque token — contact details stay on the server. */
export function useGuestSession(eventId: string) {
  const [session, setSession] = useState<DonorSession | null>(() => {
    const s = safeRead<DonorSession>(SESSION_KEY);
    return s && s.eventId === eventId ? s : null;
  });
  const [mine, setMine] = useState<MyPledge[]>(() => {
    const s = safeRead<{ eventId: string; items: MyPledge[] }>(MINE_KEY);
    return s && s.eventId === eventId ? s.items : [];
  });

  const signIn = useCallback((s: DonorSession) => {
    safeWrite(SESSION_KEY, s);
    setSession(s);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(MINE_KEY);
    } catch {
      /* ignore */
    }
    setSession(null);
    setMine([]);
  }, []);

  const remember = useCallback(
    (p: MyPledge) =>
      setMine((prev) => {
        const next = [p, ...prev].slice(0, 30);
        safeWrite(MINE_KEY, { eventId, items: next });
        return next;
      }),
    [eventId],
  );

  return { session, signIn, signOut, mine, remember };
}
