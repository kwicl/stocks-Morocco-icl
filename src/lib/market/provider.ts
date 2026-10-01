import type { MarketDataProvider, QuoteMap } from './types';
import { SimulatedMarketProvider } from './engine';

/**
 * Fabrique de fournisseurs de données de marché.
 *
 * ── Branchement d'un flux RÉEL de la Bourse de Casablanca ────────────────
 * La BVC ne publie pas d'API publique gratuite : un flux temps réel passe
 * par un backend propriétaire (proxy Node/Express ou FastAPI) qui interroge
 * une source autorisée (ex. flux d'une société de bourse, agrégateur type
 * LeBoursier / InfosBoursieres, ou licence de données BVC) et le re-expose.
 *
 * Le backend devra exposer :
 *   GET /api/quotes          → QuoteMap (polling simple, toutes les 5–15 s)
 *   WS  /api/quotes/stream   → Quote[] (optionnel, push temps réel)
 *
 * Il suffit alors d'implémenter HttpMarketProvider ci-dessous et de changer
 * la factory pour l'utiliser — aucune vue React n'est à modifier.
 */
export class HttpMarketProvider implements MarketDataProvider {
  readonly mode = 'delayed' as const;
  private quotes: QuoteMap = {};
  private listeners = new Set<(q: QuoteMap) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;

  private readonly endpoint: string;

  constructor(endpoint = '/api/quotes') {
    this.endpoint = endpoint;
  }

  start(): void {
    if (this.timer) return;
    void this.poll();
    this.timer = setInterval(() => void this.poll(), 5000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(listener: (quotes: QuoteMap) => void): () => void {
    this.listeners.add(listener);
    listener(this.quotes);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): QuoteMap {
    return this.quotes;
  }

  private async poll(): Promise<void> {
    try {
      const res = await fetch(this.endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.quotes = (await res.json()) as QuoteMap;
      this.listeners.forEach((l) => l(this.quotes));
    } catch {
      // Stratégie de repli : conserver le dernier instantané connu.
      // Un enrichissement possible : basculer automatiquement sur le
      // SimulatedMarketProvider et afficher le mode "simulated" dans l'UI.
    }
  }
}

let instance: MarketDataProvider | null = null;

/** Singleton du provider actif (mode démonstration par défaut) */
export function getMarketProvider(): MarketDataProvider {
  if (!instance) {
    instance = new SimulatedMarketProvider();
    // Pour brancher le flux réel : instance = new HttpMarketProvider('/api/quotes')
  }
  return instance;
}
