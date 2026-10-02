import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { usePortfolioStore } from '@/store/portfolio';
import { useQuotes } from '@/hooks/useQuotes';
import { formatMAD, formatPct, formatSignedMAD } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Bandeau portefeuille affiché en haut de la page principale :
 * valeur actuelle des titres détenus (renseignés dans « Mon Portefeuille »),
 * valeur d'acquisition et gain/perte en % — valorisation en temps réel.
 */
export function PortfolioStrip() {
  const positions = usePortfolioStore((s) => s.positions);
  const { quotes } = useQuotes();

  const totals = useMemo(() => {
    let cost = 0;
    let value = 0;
    for (const p of positions) {
      cost += p.quantity * p.purchasePrice;
      value += p.quantity * (quotes[p.symbol]?.last ?? p.purchasePrice);
    }
    const pnl = value - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { cost, value, pnl, pnlPct };
  }, [positions, quotes]);

  if (positions.length === 0) {
    return (
      <div className="glow-wrap">
        <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucune position — ajoutez vos titres dans{' '}
              <span className="font-medium text-foreground">Mon Portefeuille</span> pour suivre
              votre valorisation ici en temps réel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const up = totals.pnl >= 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <div className="glow-wrap">
      <div className="grid grid-cols-3 divide-x divide-border bg-card">
        <StripCell label="Valeur actuelle" value={formatMAD(totals.value)} />
        <StripCell label="Valeur d'acquisition" value={formatMAD(totals.cost)} muted />
        <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-3">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            Gain / Perte
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-sm font-bold tabular-nums sm:text-lg',
              up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {formatPct(totals.pnlPct)}
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground sm:text-xs">
            {formatSignedMAD(totals.pnl)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StripCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-3">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-bold tabular-nums sm:text-lg',
          muted && 'font-semibold text-muted-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}
