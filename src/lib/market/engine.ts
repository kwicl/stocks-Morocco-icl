import type { MarketDataProvider, QuoteMap } from './types';
import { STOCK_UNIVERSE, MASI_REFERENCE } from './universe';
import { isBvcOpen } from './hours';

const TICK_MS = 2500;
const INTRADAY_POINTS = 120;

/** Bruit gaussien (Box-Muller) pour un random walk réaliste */
function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Moteur de cotations simulées (mode démonstration).
 *
 * Random walk brownien autour du cours de référence, avec accumulation de
 * volume et suivi du plus haut / plus bas de séance. C'est l'implémentation
 * par défaut du contrat MarketDataProvider : l'UI ne fait aucune différence
 * entre ce moteur et un flux réel, ce qui permet de brancher un proxy
 * backend (WebSocket / polling sur un flux BVC) sans modification des vues.
 */
export class SimulatedMarketProvider implements MarketDataProvider {
  readonly mode = 'simulated' as const;

  private quotes: QuoteMap = {};
  private masi: number = MASI_REFERENCE;
  private listeners = new Set<(quotes: QuoteMap) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const now = Date.now();
    for (const meta of STOCK_UNIVERSE) {
      // Amorce : léger décalage autour de la référence pour un rendu vivant
      const drift = 1 + gaussian() * meta.volatility * 4;
      const last = round2(meta.referencePrice * drift);
      const open = round2(meta.referencePrice * (1 + gaussian() * meta.volatility * 2));
      const intraday: number[] = [];
      let p = open;
      for (let i = 0; i < INTRADAY_POINTS; i++) {
        p = round2(p * (1 + gaussian() * meta.volatility * 0.6));
        intraday.push(p);
      }
      intraday[INTRADAY_POINTS - 1] = last;
      this.quotes[meta.symbol] = {
        symbol: meta.symbol,
        last,
        open,
        high: Math.max(...intraday, last),
        low: Math.min(...intraday, last),
        prevClose: meta.referencePrice,
        change: round2(last - meta.referencePrice),
        changePct: round2(((last - meta.referencePrice) / meta.referencePrice) * 100),
        volume: Math.round(meta.avgVolume * (0.3 + Math.random() * 0.5)),
        turnover: 0,
        updatedAt: now,
        intraday,
      };
      this.quotes[meta.symbol].turnover = Math.round(
        this.quotes[meta.symbol].volume * last,
      );
    }
  }

  getMasi(): number {
    return this.masi;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(listener: (quotes: QuoteMap) => void): () => void {
    this.listeners.add(listener);
    listener(this.quotes);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): QuoteMap {
    return this.quotes;
  }

  private tick(): void {
    // Hors séance (soir, nuit, week-end) : les cours restent figés à la clôture
    if (!isBvcOpen()) return;
    const now = Date.now();
    for (const meta of STOCK_UNIVERSE) {
      const q = this.quotes[meta.symbol];
      // ~30 % de chances qu'un titre ne bouge pas sur un tick (marché peu liquide)
      const moved = Math.random() > 0.3;
      if (moved) {
        const shock = gaussian() * meta.volatility;
        const next = Math.max(0.01, round2(q.last * (1 + shock)));
        const traded = Math.round(meta.avgVolume * Math.random() * 0.01);
        q.last = next;
        q.high = Math.max(q.high, next);
        q.low = Math.min(q.low, next);
        q.volume += traded;
        q.turnover += Math.round(traded * next);
        q.intraday = [...q.intraday.slice(-(INTRADAY_POINTS - 1)), next];
      } else {
        q.intraday = [...q.intraday.slice(-(INTRADAY_POINTS - 1)), q.last];
      }
      q.change = round2(q.last - q.prevClose);
      q.changePct = round2((q.change / q.prevClose) * 100);
      q.updatedAt = now;
    }
    // MASI : moyenne pondérée simplifiée des variations
    const avgPct =
      STOCK_UNIVERSE.reduce((acc, m) => acc + this.quotes[m.symbol].changePct, 0) /
      STOCK_UNIVERSE.length;
    this.masi = round2(MASI_REFERENCE * (1 + avgPct / 100));
    this.listeners.forEach((l) => l(this.quotes));
  }
}
