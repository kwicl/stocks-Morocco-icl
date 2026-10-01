import { useEffect, useState } from 'react';
import type { QuoteMap } from '@/lib/market/types';
import { getMarketProvider } from '@/lib/market/provider';

/**
 * Abonnement temps réel aux cotations.
 * Le provider (simulé ou proxy réel) est un singleton démarré une seule fois.
 */
export function useQuotes(): { quotes: QuoteMap; mode: string } {
  const provider = getMarketProvider();
  const [quotes, setQuotes] = useState<QuoteMap>(() => provider.getSnapshot());

  useEffect(() => {
    provider.start();
    const unsubscribe = provider.subscribe((q) => setQuotes({ ...q }));
    return () => unsubscribe();
  }, [provider]);

  return { quotes, mode: provider.mode };
}
