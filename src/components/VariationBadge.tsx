import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPct } from '@/lib/format';

interface VariationBadgeProps {
  changePct: number;
  className?: string;
}

/** Pastille de variation : verte (hausse), rouge (baisse), neutre (inchangé) */
export function VariationBadge({ changePct, className }: VariationBadgeProps) {
  const up = changePct > 0;
  const flat = changePct === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        flat
          ? 'bg-muted text-muted-foreground'
          : up
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 text-red-600 dark:text-red-400',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {formatPct(changePct)}
    </span>
  );
}
