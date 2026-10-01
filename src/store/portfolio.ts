import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeeParams } from '@/lib/fees';
import { DEFAULT_FEE_PARAMS } from '@/lib/fees';

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  /** Prix d'acquisition unitaire (PRU) en MAD */
  purchasePrice: number;
  purchasedAt: string; // ISO date
}

interface PortfolioState {
  positions: Position[];
  feeParams: FeeParams;
  addPosition: (p: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, patch: Partial<Omit<Position, 'id'>>) => void;
  removePosition: (id: string) => void;
  setFeeParams: (patch: Partial<FeeParams>) => void;
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Portefeuille personnel persisté dans le navigateur (localStorage).
 * Les données restent locales à ce poste : pas de compte, pas de serveur.
 */
export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      positions: [],
      feeParams: DEFAULT_FEE_PARAMS,
      addPosition: (p) =>
        set((s) => ({ positions: [...s.positions, { ...p, id: newId() }] })),
      updatePosition: (id, patch) =>
        set((s) => ({
          positions: s.positions.map((pos) =>
            pos.id === id ? { ...pos, ...patch } : pos,
          ),
        })),
      removePosition: (id) =>
        set((s) => ({ positions: s.positions.filter((pos) => pos.id !== id) })),
      setFeeParams: (patch) =>
        set((s) => ({ feeParams: { ...s.feeParams, ...patch } })),
    }),
    { name: 'casablanca-stock-portfolio' },
  ),
);
