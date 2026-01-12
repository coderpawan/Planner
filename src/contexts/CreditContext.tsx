'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToCredits, getUserCredits, getUnlockedServices } from '@/lib/creditUtils';

interface CreditContextType {
  credits: number;
  unlockedServices: string[];
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState(0);
  const [unlockedServices, setUnlockedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [previousCredits, setPreviousCredits] = useState<number | null>(null);

  // Get UID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('uid');
      console.log('🔹 CreditContext: Retrieved UID from localStorage:', storedUid);
      setUid(storedUid);
    }
  }, []);

  // Subscribe to real-time credit updates
  useEffect(() => {
    if (!uid) {
      console.log('🔸 CreditContext: No UID, skipping credit subscription');
      setIsLoading(false);
      return;
    }

    console.log('🔹 CreditContext: Subscribing to credits for UID:', uid);
    setIsLoading(true);
    
    // Subscribe to real-time credit updates from Realtime DB
    const unsubscribe = subscribeToCredits(uid, (newCredits) => {
      console.log('🔹 CreditContext: Received credit update:', { credits: newCredits });
      setCredits(newCredits);
      
      // If credits decreased, refresh unlocked services from Firestore
      if (previousCredits !== null && newCredits < previousCredits) {
        console.log('🔹 CreditContext: Credits decreased, refreshing unlocked services');
        getUnlockedServices(uid).then(services => {
          console.log('🔹 CreditContext: Refreshed unlocked services:', services);
          setUnlockedServices(services);
        });
      }
      
      setPreviousCredits(newCredits);
      setIsLoading(false);
    });

    // Fetch unlocked services from Firestore (one-time on mount)
    getUnlockedServices(uid).then(services => {
      console.log('🔹 CreditContext: Fetched unlocked services from Firestore:', services);
      setUnlockedServices(services);
    });

    return () => {
      console.log('🔸 CreditContext: Unsubscribing from credits');
      unsubscribe();
    };
  }, [uid]);

  const refreshCredits = async () => {
    if (!uid) return;
    
    try {
      const [newCredits, newUnlockedServices] = await Promise.all([
        getUserCredits(uid),
        getUnlockedServices(uid)
      ]);
      console.log('🔹 CreditContext: Manual refresh:', { credits: newCredits, unlockedServices: newUnlockedServices });
      setCredits(newCredits);
      setUnlockedServices(newUnlockedServices);
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  return (
    <CreditContext.Provider value={{ credits, unlockedServices, isLoading, refreshCredits }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
}
