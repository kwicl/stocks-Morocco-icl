import { useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuotes } from '@/hooks/useQuotes';
import { STOCK_UNIVERSE, MASI_REFERENCE } from '@/lib/market/universe';
import { getMarketProvider } from '@/lib/market/provider';
import { formatMAD, formatPct, formatSignedMAD, formatTime, formatVolume } from '@/lib/format';
import { Sparkline } from '@/components/Sparkline';
import { VariationBadge } from '@/components/VariationBadge';
import { StockDetailSheet } from '@/sections/StockDetailSheet';
import { cn } from '@/lib/utils';

export function MarketWatch() {
  const { quotes, mode } = useQuotes();
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);

  const stats = useMemo(() => {
    const list = Object.values(quotes);
    const up = list.filter((q) => q.changePct > 0).length;
    const down = list.filter((q) => q.changePct < 0).length;
    const lastUpdate = list.reduce((acc, q) => Math.max(acc, q.updatedAt), 0);
    const avgPct =
      list.length > 0 ? list.reduce((a, q) => a + q.changePct, 0) / list.length : 0;
    const masi = MASI_REFERENCE * (1 + avgPct / 100);
    return { up, down, lastUpdate, masi, masiPct: avgPct };
  }, [quotes]);

  const provider = getMarketProvider();

  return (
    <div className="space-y-4">
      {/* Bandeau synthèse marché */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Indice MASI (indicatif)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold tabular-nums">
                {stats.masi.toLocaleString('fr-MA', { maximumFractionDigits: 0 })}
              </span>
              <VariationBadge changePct={Number(stats.masiPct.toFixed(2))} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Hausses / Baisses
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 pb-4">
            <span className="inline-flex items-center gap-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              {stats.up}
            </span>
            <span className="inline-flex items-center gap-1 text-lg font-bold text-red-600 dark:text-red-400">
              <ArrowDownRight className="h-4 w-4" />
              {stats.down}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Dernière mise à jour
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <span className="inline-flex items-center gap-1.5 text-lg font-bold tabular-nums">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {stats.lastUpdate ? formatTime(new Date(stats.lastUpdate)) : '—'}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Flux de données</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5',
                mode === 'simulated'
                  ? 'border-amber-500/50 text-amber-600 dark:text-amber-400'
                  : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400',
              )}
            >
              <Activity className="h-3 w-3 animate-pulse" />
              {mode === 'simulated' ? 'Flux simulé (démo)' : 'Flux temps réel'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des cours */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Cours en direct — Bourse de Casablanca</CardTitle>
          <span className="text-xs text-muted-foreground">
            {provider.mode === 'simulated'
              ? 'Données simulées à titre de démonstration, basées sur les dernières clôtures publiées.'
              : 'Cours diffusés par le flux de marché.'}{' '}
            Touchez une valeur pour ouvrir son graphique historique.
          </span>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 sm:pl-0">Valeur</TableHead>
                <TableHead className="text-right">Dernier</TableHead>
                <TableHead className="text-right">Var. (MAD)</TableHead>
                <TableHead className="text-right">Var. (%)</TableHead>
                <TableHead className="text-right">Ouverture</TableHead>
                <TableHead className="text-right">+ Haut</TableHead>
                <TableHead className="text-right">+ Bas</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Montant échangé</TableHead>
                <TableHead className="pr-4 text-right sm:pr-0">Séance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STOCK_UNIVERSE.map((meta) => {
                const q = quotes[meta.symbol];
                if (!q) return null;
                const positive = q.changePct >= 0;
                return (
                  <TableRow
                    key={meta.symbol}
                    className="cursor-pointer"
                    onClick={() => setDetailSymbol(meta.symbol)}
                  >
                    <TableCell className="pl-4 sm:pl-0">
                      <div className="flex flex-col">
                        <span className="font-semibold">{meta.symbol}</span>
                        <span className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {meta.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold tabular-nums',
                        positive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatMAD(q.last, false)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatSignedMAD(q.change, false)}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationBadge changePct={q.changePct} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMAD(q.open, false)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMAD(q.high, false)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMAD(q.low, false)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatVolume(q.volume)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMAD(q.turnover, false)}
                    </TableCell>
                    <TableCell className="pr-4 sm:pr-0">
                      <div className="flex justify-end">
                        <Sparkline data={q.intraday} positive={positive} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fiches détaillées */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STOCK_UNIVERSE.map((meta) => {
          const q = quotes[meta.symbol];
          if (!q) return null;
          return (
            <Card
              key={meta.symbol}
              className="cursor-pointer transition-colors hover:border-emerald-500/40"
              onClick={() => setDetailSymbol(meta.symbol)}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{meta.symbol}</CardTitle>
                  <VariationBadge changePct={q.changePct} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{meta.name}</p>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <div className="text-2xl font-bold tabular-nums">{formatMAD(q.last)}</div>
                <Sparkline data={q.intraday} positive={q.changePct >= 0} width={220} height={40} />
                <div className="grid grid-cols-2 gap-x-2 text-xs text-muted-foreground">
                  <span>Secteur</span>
                  <span className="truncate text-right text-foreground">{meta.sector}</span>
                  <span>Variation</span>
                  <span className="text-right tabular-nums text-foreground">
                    {formatSignedMAD(q.change)} · {formatPct(q.changePct)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <StockDetailSheet
        symbol={detailSymbol}
        open={detailSymbol !== null}
        onOpenChange={(open) => {
          if (!open) setDetailSymbol(null);
        }}
      />
    </div>
  );
}
