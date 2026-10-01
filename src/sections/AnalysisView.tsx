import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortfolioStore } from '@/store/portfolio';
import { useQuotes } from '@/hooks/useQuotes';
import { STOCK_BY_SYMBOL } from '@/lib/market/universe';
import { formatMAD, formatPct } from '@/lib/format';

const CHART_COLORS = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e'];

export function AnalysisView() {
  const positions = usePortfolioStore((s) => s.positions);
  const { quotes } = useQuotes();

  const rows = useMemo(
    () =>
      positions.map((p) => {
        const last = quotes[p.symbol]?.last ?? 0;
        const cost = p.quantity * p.purchasePrice;
        const value = p.quantity * last;
        const pnl = value - cost;
        return {
          symbol: p.symbol,
          name: STOCK_BY_SYMBOL[p.symbol]?.name ?? p.symbol,
          value,
          cost,
          pnl,
          pnlPct: cost > 0 ? (pnl / cost) * 100 : 0,
        };
      }),
    [positions, quotes],
  );

  const totalValue = rows.reduce((a, r) => a + r.value, 0);

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="font-medium">Aucune donnée à analyser</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ajoutez des positions dans l'onglet « Mon Portefeuille » pour visualiser la répartition
            sectorielle et la performance de vos investissements.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Répartition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition du portefeuille (valeur actuelle)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="symbol"
                  innerRadius={62}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {rows.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatMAD(Number(v ?? 0))}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {rows.map((r, i) => (
              <div key={r.symbol} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="font-medium">{r.symbol}</span>
                  <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground sm:inline">
                    {r.name}
                  </span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {totalValue > 0 ? `${((r.value / totalValue) * 100).toFixed(1).replace('.', ',')} %` : '—'}
                  <span className="ml-2 text-foreground">{formatMAD(r.value)}</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance par position */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plus/Moins-value latente par position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="symbol" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v: number) =>
                    Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(v) => formatMAD(Number(v ?? 0))}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {rows.map((r, i) => (
                    <Cell key={i} fill={r.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rows.map((r) => (
              <div key={r.symbol} className="rounded-lg border p-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">{r.symbol}</div>
                <div
                  className="text-sm font-bold tabular-nums"
                  style={{ color: r.pnl >= 0 ? '#22c55e' : '#ef4444' }}
                >
                  {formatPct(r.pnlPct)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
