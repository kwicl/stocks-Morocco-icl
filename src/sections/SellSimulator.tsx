import { useEffect, useMemo, useState } from 'react';
import { Calculator, Settings2, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { usePortfolioStore, type Position } from '@/store/portfolio';
import { simulateSale } from '@/lib/fees';
import { STOCK_BY_SYMBOL } from '@/lib/market/universe';
import { formatMAD, formatPct, formatSignedMAD } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { QuoteMap } from '@/lib/market/types';

interface SellSimulatorProps {
  position: Position | null;
  quotes: QuoteMap;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Simulateur de cession — calcul du "net à recevoir" après frais BVC :
 * commission de courtage HT, TVA 10 % sur commission, TPC 15 % sur la
 * plus-value. Les paramètres de frais sont éditables et persistés.
 */
export function SellSimulator({ position, quotes, open, onOpenChange }: SellSimulatorProps) {
  const feeParams = usePortfolioStore((s) => s.feeParams);
  const setFeeParams = usePortfolioStore((s) => s.setFeeParams);

  const [quantity, setQuantity] = useState(0);
  const [salePriceInput, setSalePriceInput] = useState('');
  const [showFeeSettings, setShowFeeSettings] = useState(false);

  const livePrice = position ? quotes[position.symbol]?.last : undefined;

  // Réinitialisation à l'ouverture / changement de position
  useEffect(() => {
    if (position && open) {
      setQuantity(position.quantity);
      setSalePriceInput('');
    }
  }, [position, open]);

  const salePrice = useMemo(() => {
    const parsed = Number(salePriceInput.replace(',', '.'));
    if (salePriceInput.trim() !== '' && Number.isFinite(parsed) && parsed > 0) return parsed;
    return livePrice ?? 0;
  }, [salePriceInput, livePrice]);

  const result = useMemo(() => {
    if (!position || quantity <= 0 || salePrice <= 0) return null;
    return simulateSale({
      quantity,
      salePrice,
      purchasePrice: position.purchasePrice,
      fees: feeParams,
    });
  }, [position, quantity, salePrice, feeParams]);

  if (!position) return null;
  const meta = STOCK_BY_SYMBOL[position.symbol];

  const brokeragePct = feeParams.brokerageRate * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulateur de cession — {position.symbol}
          </SheetTitle>
          <SheetDescription>
            {meta?.name} · Prix d'acquisition : {formatMAD(position.purchasePrice)} ·{' '}
            {position.quantity} titres détenus
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quantité à céder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Quantité à vendre</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-24 text-right tabular-nums"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => {
                    const v = Math.floor(Number(e.target.value));
                    if (Number.isFinite(v)) {
                      setQuantity(Math.max(0, Math.min(position.quantity, v)));
                    } else if (e.target.value === '') {
                      setQuantity(0);
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">/ {position.quantity}</span>
              </div>
            </div>
            <Slider
              value={[quantity]}
              min={0}
              max={position.quantity}
              step={1}
              onValueChange={([v]) => setQuantity(v)}
            />
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((pct) => (
                <Button
                  key={pct}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    setQuantity(Math.round((position.quantity * pct) / 100))
                  }
                >
                  {pct === 100 ? 'Tout' : `${pct} %`}
                </Button>
              ))}
            </div>
          </div>

          {/* Cours de cession */}
          <div className="space-y-1.5">
            <Label htmlFor="salePrice">Cours de cession unitaire (MAD)</Label>
            <Input
              id="salePrice"
              inputMode="decimal"
              placeholder={livePrice ? `Cours actuel : ${livePrice.toFixed(2)}` : 'Cours de vente'}
              value={salePriceInput}
              onChange={(e) => setSalePriceInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laisser vide pour utiliser le cours actuel
              {livePrice ? ` (${formatMAD(livePrice)})` : ''}.
            </p>
          </div>

          {/* Paramètres de frais */}
          <div className="rounded-lg border p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-medium"
              onClick={() => setShowFeeSettings((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Paramètres de frais (BVC)
              </span>
              <span className="text-xs text-muted-foreground">
                Courtage {(brokeragePct).toFixed(2).replace('.', ',')} % HT · TVA 10 % · TPC 15 %
              </span>
            </button>
            {showFeeSettings && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Commission de courtage HT</Label>
                    <span className="tabular-nums text-muted-foreground">
                      {brokeragePct.toFixed(2).replace('.', ',')} %
                    </span>
                  </div>
                  <Slider
                    value={[brokeragePct]}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onValueChange={([v]) => setFeeParams({ brokerageRate: v / 100 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Fourchette usuelle des sociétés de bourse : 0,3 % à 0,6 % HT.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minCommission">Commission minimale par ordre (MAD)</Label>
                  <Input
                    id="minCommission"
                    inputMode="decimal"
                    value={feeParams.minCommission}
                    onChange={(e) => {
                      const v = Number(e.target.value.replace(',', '.'));
                      setFeeParams({ minCommission: Number.isFinite(v) && v >= 0 ? v : 0 });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="applyTpc">TPC — Taxe sur les Profits de Cession (15 %)</Label>
                    <p className="text-xs text-muted-foreground">
                      Retenue à la source sur la plus-value nette (titres cotés, personne physique).
                    </p>
                  </div>
                  <Switch
                    id="applyTpc"
                    checked={feeParams.applyTpc}
                    onCheckedChange={(v) => setFeeParams({ applyTpc: v })}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Résultats */}
          {result && quantity > 0 ? (
            <div className="space-y-1 text-sm">
              <ResultRow label={`Montant brut (${quantity} × ${formatMAD(salePrice, false)})`} value={formatMAD(result.grossAmount)} />
              <ResultRow
                label={`Commission de courtage HT (${brokeragePct.toFixed(2).replace('.', ',')} %)`}
                value={`- ${formatMAD(result.commissionHT)}`}
                muted
              />
              <ResultRow label="TVA sur commission (10 %)" value={`- ${formatMAD(result.vat)}`} muted />
              <ResultRow
                label="TPC (15 % de la plus-value nette)"
                value={result.tpc > 0 ? `- ${formatMAD(result.tpc)}` : '0,00 MAD'}
                muted
              />
              <Separator className="my-2" />
              <ResultRow label="Total frais & taxes" value={`- ${formatMAD(result.totalFees)}`} bold />
              <div className="mt-3 rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net à recevoir</span>
                  <span className="text-lg font-bold tabular-nums">{formatMAD(result.netReceived)}</span>
                </div>
              </div>
              <div className="mt-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Coût d'acquisition (quantité vendue)</span>
                  <span className="tabular-nums">{formatMAD(result.costBasis)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-medium">Plus/Moins-value nette réalisée</span>
                  <span
                    className={cn(
                      'font-bold tabular-nums',
                      result.netPnl >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {formatSignedMAD(result.netPnl)} ({formatPct(result.netPnlPct)})
                  </span>
                </div>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Simulation indicative. Le calcul exact dépend de votre société de bourse
                (minima de perception, frais annexes) et de votre situation fiscale.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Saisissez une quantité à vendre pour lancer la simulation.
            </p>
          )}

          {/* Bouton de fermeture proéminent (mobile) */}
          <Button
            variant="secondary"
            size="lg"
            className="safe-bottom sticky bottom-2 w-full shadow-lg"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-1.5 h-4 w-4" />
            Fermer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ResultRow({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={cn(muted && 'text-muted-foreground', bold && 'font-semibold')}>{label}</span>
      <span className={cn('tabular-nums', muted && 'text-muted-foreground', bold && 'font-semibold')}>
        {value}
      </span>
    </div>
  );
}
