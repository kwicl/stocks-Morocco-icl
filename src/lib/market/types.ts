/**
 * Types partagés de la couche "market data".
 *
 * Ces interfaces constituent le contrat entre le frontend et la source de
 * cotations. Elles sont volontairement alignées sur ce qu'un proxy backend
 * (Node/Express ou FastAPI) exposerait via GET /api/quotes ou un flux
 * WebSocket, afin de pouvoir remplacer le moteur simulé par un flux réel
 * de la Bourse de Casablanca sans toucher à l'UI.
 */

export type QuoteMode = 'live' | 'delayed' | 'simulated';

export interface StockMeta {
  /** Symbole interne utilisé par l'application */
  symbol: string;
  /** Ticker officiel à la Bourse de Casablanca */
  ticker: string;
  name: string;
  sector: string;
  isin: string;
  /** Prix de référence (clôture précédente) en MAD */
  referencePrice: number;
  /** Volatilité intrajournalière relative (paramètre du moteur) */
  volatility: number;
  /** Volume moyen de séance en titres (paramètre du moteur) */
  avgVolume: number;
}

export interface Quote {
  symbol: string;
  /** Dernier cours en MAD */
  last: number;
  /** Cours d'ouverture de la séance */
  open: number;
  /** Plus haut de la séance */
  high: number;
  /** Plus bas de la séance */
  low: number;
  /** Clôture de la veille (base des variations) */
  prevClose: number;
  /** Variation absolue en MAD */
  change: number;
  /** Variation en % */
  changePct: number;
  /** Volume échangé (titres) */
  volume: number;
  /** Montant échangé (MAD) */
  turnover: number;
  /** Horodatage de la dernière mise à jour (ms epoch) */
  updatedAt: number;
  /** Historique intrajournalier pour le sparkline (du plus ancien au plus récent) */
  intraday: number[];
}

export type QuoteMap = Record<string, Quote>;

/**
 * Contrat d'un fournisseur de données de marché.
 * Implémentations : SimulatedMarketProvider (défaut, démo) et
 * HttpMarketProvider (proxy backend vers un flux réel BVC).
 */
export interface MarketDataProvider {
  readonly mode: QuoteMode;
  start(): void;
  stop(): void;
  /** Abonnement aux mises à jour ; retourne une fonction de désabonnement */
  subscribe(listener: (quotes: QuoteMap) => void): () => void;
  getSnapshot(): QuoteMap;
}
