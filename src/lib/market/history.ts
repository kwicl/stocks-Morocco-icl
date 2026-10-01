import { STOCK_BY_SYMBOL } from './universe';

export interface HistoryPoint {
  /** Date ISO (yyyy-mm-dd) */
  date: string;
  /** Libellé court pour l'axe (ex. « 12 sept. ») */
  label: string;
  /** Clôture en MAD */
  close: number;
}

/** PRNG déterministe (mulberry32) — historique stable d'un chargement à l'autre */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const TRADING_DAYS = 260; // ~1 an de séances
const cache: Record<string, HistoryPoint[]> = {};

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

/**
 * Historique quotidien simulé, généré par marche aléatoire rétrograde depuis
 * la dernière clôture publiée : le dernier point correspond toujours au cours
 * de référence réel, et la série est déterministe (seedée par le symbole).
 * Sera remplacée par l'historique réel du provider backend le cas échéant.
 */
export function getDailyHistory(symbol: string): HistoryPoint[] {
  if (cache[symbol]) return cache[symbol];
  const meta = STOCK_BY_SYMBOL[symbol];
  if (!meta) return [];

  const rng = mulberry32(hashString(symbol));
  const dailyVol = meta.volatility * 7;

  // Marche aléatoire inversée : on part de la clôture de référence
  const closes: number[] = [meta.referencePrice];
  for (let i = 1; i < TRADING_DAYS; i++) {
    const shock = (rng() * 2 - 1) * dailyVol + (rng() - 0.5) * dailyVol * 0.4;
    closes.unshift(Math.max(0.01, closes[0] / (1 + shock)));
  }

  // Dates : jours ouvrés en remontant depuis aujourd'hui
  const points: HistoryPoint[] = [];
  const d = new Date();
  let i = closes.length - 1;
  while (i >= 0) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      points.unshift({
        date: d.toISOString().slice(0, 10),
        label: dateFmt.format(d),
        close: Math.round(closes[i] * 100) / 100,
      });
      i--;
    }
    d.setDate(d.getDate() - 1);
  }
  cache[symbol] = points;
  return points;
}

export interface PeriodDef {
  key: string;
  label: string;
  /** Nombre de séances à afficher */
  days: number;
}

export const PERIODS: PeriodDef[] = [
  { key: '5J', label: '5J', days: 5 },
  { key: '1M', label: '1M', days: 22 },
  { key: '3M', label: '3M', days: 66 },
  { key: '6M', label: '6M', days: 132 },
  { key: '1A', label: '1A', days: TRADING_DAYS },
];

export function sliceHistory(symbol: string, days: number): HistoryPoint[] {
  const all = getDailyHistory(symbol);
  return all.slice(-days);
}
