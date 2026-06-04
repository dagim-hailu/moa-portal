"use client";

import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { type JwtPayload } from "@moa/shared/auth";

interface SessionContextType {
  session: JwtPayload | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({ session: null, loading: true });

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<JwtPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
