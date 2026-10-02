import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Calculator, Wallet, PiggyBank, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePortfolioStore, type Position } from '@/store/portfolio';
import { useQuotes } from '@/hooks/useQuotes';
import { STOCK_BY_SYMBOL } from '@/lib/market/universe';
import { formatMAD, formatPct, formatSignedMAD, formatInt } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PositionDialog } from './PositionDialog';
import { SellSimulator } from './SellSimulator';

export function PortfolioView() {
  const positions = usePortfolioStore((s) => s.positions);
  const removePosition = usePortfolioStore((s) => s.removePosition);
  const { quotes } = useQuotes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [deleting, setDeleting] = useState<Position | null>(null);
  const [simulating, setSimulating] = useState<Position | null>(null);

  const rows = useMemo(
    () =>
      positions.map((p) => {
        const last = quotes[p.symbol]?.last ?? 0;
        const cost = p.quantity * p.purchasePrice;
        const value = p.quantity * last;
        const pnl = value - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        return { position: p, last, cost, value, pnl, pnlPct };
      }),
    [positions, quotes],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          cost: acc.cost + r.cost,
          value: acc.value + r.value,
          pnl: acc.pnl + r.pnl,
        }),
        { cost: 0, value: 0, pnl: 0 },
      ),
    [rows],
  );
  const totalsPct = totals.cost > 0 ? (totals.pnl / totals.cost) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Synthèse — indicateurs principaux à lueur multicolore */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glow-wrap">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Valeur actuelle du portefeuille
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-4">
              <span className="text-2xl font-bold tabular-nums">{formatMAD(totals.value)}</span>
            </CardContent>
          </Card>
        </div>
        <div className="glow-wrap">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Coût d'acquisition total
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-4">
              <span className="text-2xl font-bold tabular-nums">{formatMAD(totals.cost)}</span>
            </CardContent>
          </Card>
        </div>
        <div className="glow-wrap">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Plus/Moins-value latente
              </CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-4">
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  totals.pnl >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {formatSignedMAD(totals.pnl)}
              </span>
              <span className="ml-2 text-sm text-muted-foreground tabular-nums">
                ({formatPct(totalsPct)})
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table des positions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Mes actions</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter une position
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium">Aucune position pour le moment</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ajoutez vos achats (IAM, TGCC, SGTM, RISMA, CIH) pour suivre votre portefeuille
                valorisé en temps réel. Vos données restent stockées localement dans ce navigateur.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-0">Action</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">PRU (MAD)</TableHead>
                  <TableHead className="text-right">Coût total</TableHead>
                  <TableHead className="text-right">Cours actuel</TableHead>
                  <TableHead className="text-right">Valeur actuelle</TableHead>
                  <TableHead className="text-right">PV latente (MAD)</TableHead>
                  <TableHead className="text-right">PV latente (%)</TableHead>
                  <TableHead className="pr-4 text-right sm:pr-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ position: p, last, cost, value, pnl, pnlPct }) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-4 sm:pl-0">
                      <div className="flex flex-col">
                        <span className="font-semibold">{p.symbol}</span>
                        <span className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {STOCK_BY_SYMBOL[p.symbol]?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatInt(p.quantity)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMAD(p.purchasePrice, false)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMAD(cost)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMAD(last, false)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMAD(value)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold tabular-nums',
                        pnl >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatSignedMAD(pnl)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold tabular-nums',
                        pnlPct >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatPct(pnlPct)}
                    </TableCell>
                    <TableCell className="pr-4 sm:pr-0">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Simuler une cession"
                          onClick={() => setSimulating(p)}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Modifier"
                          onClick={() => {
                            setEditing(p);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Ligne de total */}
                <TableRow className="border-t-2 font-semibold">
                  <TableCell className="pl-4 sm:pl-0">Total</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{formatMAD(totals.cost)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">{formatMAD(totals.value)}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums',
                      totals.pnl >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatSignedMAD(totals.pnl)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums',
                      totalsPct >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatPct(totalsPct)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PositionDialog open={dialogOpen} onOpenChange={setDialogOpen} position={editing} />
      <SellSimulator
        position={simulating}
        quotes={quotes}
        open={simulating !== null}
        onOpenChange={(open) => {
          if (!open) setSimulating(null);
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette position ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.quantity} × ${deleting.symbol} seront définitivement retirés de votre portefeuille.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) removePosition(deleting.id);
                setDeleting(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
