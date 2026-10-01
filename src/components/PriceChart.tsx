import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PERIODS, sliceHistory, type HistoryPoint } from '@/lib/market/history';
import { formatMAD, formatPct, formatSignedMAD } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PriceChartProps {
  symbol: string;
  /** Cours actuel (flux temps réel) — ajouté comme dernier point du graphique */
  livePrice?: number;
}

interface ChartPoint extends HistoryPoint {
  isLive?: boolean;
}

/**
 * Graphique historique avec sélecteur de période (5J / 1M / 3M / 6M / 1A).
 * Au survol ou au glissement du doigt (mobile), la valeur et la date du point
 * touché s'affichent dans l'en-tête ET dans l'info-bulle qui suit le doigt.
 */
export function PriceChart({ symbol, livePrice }: PriceChartProps) {
  const [periodKey, setPeriodKey] = useState('3M');
  // Point actif sous le curseur / le doigt
  const [active, setActive] = useState<ChartPoint | null>(null);

  const period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[2];

  const data: ChartPoint[] = useMemo(() => {
    const base = sliceHistory(symbol, period.days);
    if (livePrice && base.length > 0) {
      const last = base[base.length - 1];
      if (Math.abs(last.close - livePrice) > 0.001) {
        return [...base, { ...last, close: livePrice, label: 'Actuel', isLive: true }];
      }
    }
    return base;
  }, [symbol, period.days, livePrice]);

  const first = data[0]?.close ?? 0;
  const lastPoint = data[data.length - 1];
  const shown = active ?? lastPoint;
  const periodChange = shown ? shown.close - first : 0;
  const periodChangePct = first > 0 ? (periodChange / first) * 100 : 0;
  const positive = (shown?.close ?? 0) >= first;
  const color = positive ? '#22c55e' : '#ef4444';

  const minClose = Math.min(...data.map((d) => d.close));
  const maxClose = Math.max(...data.map((d) => d.close));
  const pad = (maxClose - minClose) * 0.08 || 1;

  return (
    <div className="space-y-3">
      {/* Sélecteur de période */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 rounded-full border bg-muted/50 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPeriodKey(p.key);
                setActive(null);
              }}
              className={cn(
                'min-w-10 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                periodKey === p.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            periodChange >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400',
          )}
        >
          {formatSignedMAD(periodChange, false)} ({formatPct(periodChangePct)}) sur {period.label}
        </span>
      </div>

      {/* Valeur sous le doigt / curseur (ou dernière valeur) */}
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tabular-nums sm:text-3xl">
          {shown ? formatMAD(shown.close) : '—'}
        </span>
        <span className="text-sm text-muted-foreground">
          {active ? active.label : shown?.isLive ? 'Cours actuel' : `Clôture du ${shown?.label ?? ''}`}
        </span>
      </div>

      {/* Graphique — l'info-bulle suit le doigt au toucher */}
      <div className="h-64 w-full touch-none sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
            onMouseLeave={() => setActive(null)}
          >
            <defs>
              <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              minTickGap={48}
            />
            <YAxis
              domain={[minClose - pad, maxClose + pad]}
              tick={{ fontSize: 10 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => v.toFixed(0)}
            />
            <ReferenceLine y={first} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
            <Tooltip
              content={<ChartTooltip onActivePoint={setActive} />}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${symbol})`}
              isAnimationActive={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPayloadItem {
  payload?: ChartPoint;
}

/**
 * Info-bulle personnalisée : recharts la met à jour au survol comme au
 * glissement du doigt — elle remonte le point actif au composant parent
 * pour l'affichage dans l'en-tête.
 */
function ChartTooltip({
  active,
  payload,
  onActivePoint,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  onActivePoint?: (p: ChartPoint | null) => void;
}) {
  const point = active && payload?.[0]?.payload ? payload[0].payload : null;

  useEffect(() => {
    onActivePoint?.(point);
  }, [point, onActivePoint]);

  if (!point) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-semibold tabular-nums">{formatMAD(point.close)}</div>
      <div className="text-muted-foreground">{point.isLive ? 'Cours actuel' : point.label}</div>
    </div>
  );
}
