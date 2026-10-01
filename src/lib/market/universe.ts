import type { StockMeta } from './types';

/**
 * Univers des valeurs suivies — Bourse de Casablanca.
 *
 * Prix de référence : dernières clôtures publiées connues au 30/09/2026
 * (sources publiques : Bourse de Casablanca, Investing.com, BMCE Capital,
 * Casabourse). Ils servent de base au moteur de démonstration et seront
 * écrasés par le flux réel dès qu'un provider "live" est branché.
 */
export const STOCK_UNIVERSE: StockMeta[] = [
  {
    symbol: 'IAM',
    ticker: 'IAM',
    name: 'Maroc Telecom (Ittissalat Al-Maghrib)',
    sector: 'Télécommunications',
    isin: 'MA0000011488',
    referencePrice: 95.5,
    volatility: 0.0009,
    avgVolume: 25000,
  },
  {
    symbol: 'TGCC',
    ticker: 'TGC',
    name: 'TGCC S.A',
    sector: 'Bâtiment & matériaux de construction',
    isin: 'MA0000012528',
    referencePrice: 665.0,
    volatility: 0.0016,
    avgVolume: 5500,
  },
  {
    symbol: 'SGTM',
    ticker: 'GTM',
    name: 'SGTM — Société Générale des Travaux du Maroc',
    sector: 'Bâtiment & matériaux de construction',
    isin: 'MA0000012783',
    referencePrice: 610.0,
    volatility: 0.0018,
    avgVolume: 9000,
  },
  {
    symbol: 'RISMA',
    ticker: 'RIS',
    name: 'Risma Hôtellerie & Tourisme',
    sector: 'Loisirs & hôtellerie',
    isin: 'MA0000011447',
    referencePrice: 320.0,
    volatility: 0.0012,
    avgVolume: 3000,
  },
  {
    symbol: 'CIH',
    ticker: 'CIH',
    name: 'CIH Bank (Crédit Immobilier et Hôtelier)',
    sector: 'Banques',
    isin: 'MA0000011454',
    referencePrice: 318.0,
    volatility: 0.0011,
    avgVolume: 12000,
  },
];

export const STOCK_BY_SYMBOL: Record<string, StockMeta> = Object.fromEntries(
  STOCK_UNIVERSE.map((s) => [s.symbol, s]),
);

/** Indice MASI (affiché en bandeau, à titre indicatif) */
export const MASI_REFERENCE = 17790.0;
