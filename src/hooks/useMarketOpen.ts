import { useEffect, useState } from 'react';
import { isBvcOpen } from '@/lib/market/hours';

/** Statut d'ouverture du marché, revérifié toutes les 30 secondes */
export function useMarketOpen(): boolean {
  const [open, setOpen] = useState(() => isBvcOpen());

  useEffect(() => {
    const timer = setInterval(() => setOpen(isBvcOpen()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return open;
}
