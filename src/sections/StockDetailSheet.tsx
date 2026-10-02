import { useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PriceChart } from '@/components/PriceChart';
import { VariationBadge } from '@/components/VariationBadge';
import { useQuotes } from '@/hooks/useQuotes';
import { STOCK_BY_SYMBOL } from '@/lib/market/universe';
import { getDailyHistory } from '@/lib/market/history';
import { formatMAD, formatSignedMAD, formatVolume } from '@/lib/format';

interface StockDetailSheetProps {
  symbol: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Fiche détaillée d'une valeur : graphique historique + statistiques */
export function StockDetailSheet({ symbol, open, onOpenChange }: StockDetailSheetProps) {
  const { quotes } = useQuotes();

  const meta = symbol ? STOCK_BY_SYMBOL[symbol] : undefined;
  const quote = symbol ? quotes[symbol] : undefined;

  const yearStats = useMemo(() => {
    if (!symbol) return null;
    const closes = getDailyHistory(symbol).map((p) => p.close);
    return { high52: Math.max(...closes), low52: Math.min(...closes) };
  }, [symbol]);

  if (!meta || !quote) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <SheetTitle className="text-lg">{meta.symbol}</SheetTitle>
            <VariationBadge changePct={quote.changePct} />
          </div>
          <SheetDescription>
            {meta.name} · {meta.sector} · ISIN {meta.isin}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          <PriceChart symbol={meta.symbol} livePrice={quote.last} />

          {/* Statistiques de la séance et de l'année */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border p-4 text-sm sm:grid-cols-3">
            <Stat label="Dernier cours" value={formatMAD(quote.last)} strong />
            <Stat label="Variation" value={`${formatSignedMAD(quote.change)} `} />
            <Stat label="Clôture veille" value={formatMAD(quote.prevClose)} />
            <Stat label="Ouverture" value={formatMAD(quote.open)} />
            <Stat label="+ Haut séance" value={formatMAD(quote.high)} />
            <Stat label="+ Bas séance" value={formatMAD(quote.low)} />
            <Stat label="Volume" value={formatVolume(quote.volume)} />
            <Stat label="Montant échangé" value={formatMAD(quote.turnover)} />
            {yearStats && (
              <>
                <Stat label="+ Haut 52 sem." value={formatMAD(yearStats.high52)} />
                <Stat label="+ Bas 52 sem." value={formatMAD(yearStats.low52)} />
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Historique simulé calé sur la dernière clôture publiée (démonstration). Glissez le
            doigt ou le curseur sur le graphique pour lire la valeur à chaque date.
          </p>

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

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={strong ? 'font-bold tabular-nums' : 'font-medium tabular-nums'}>{value}</span>
    </div>
  );
}
