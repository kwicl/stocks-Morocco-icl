import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePortfolioStore, type Position } from '@/store/portfolio';
import { STOCK_UNIVERSE } from '@/lib/market/universe';

interface PositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Position à modifier ; null = ajout */
  position: Position | null;
}

interface FormValues {
  symbol: string;
  quantity: string;
  purchasePrice: string;
  purchasedAt: string;
}

export function PositionDialog({ open, onOpenChange, position }: PositionDialogProps) {
  const addPosition = usePortfolioStore((s) => s.addPosition);
  const updatePosition = usePortfolioStore((s) => s.updatePosition);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      symbol: 'IAM',
      quantity: '',
      purchasePrice: '',
      purchasedAt: new Date().toISOString().slice(0, 10),
    },
  });

  const symbol = watch('symbol');

  useEffect(() => {
    if (open) {
      setError(null);
      reset(
        position
          ? {
              symbol: position.symbol,
              quantity: String(position.quantity),
              purchasePrice: String(position.purchasePrice),
              purchasedAt: position.purchasedAt,
            }
          : {
              symbol: 'IAM',
              quantity: '',
              purchasePrice: '',
              purchasedAt: new Date().toISOString().slice(0, 10),
            },
      );
    }
  }, [open, position, reset]);

  const onSubmit = (values: FormValues) => {
    const quantity = Number(values.quantity.replace(',', '.'));
    const purchasePrice = Number(values.purchasePrice.replace(',', '.'));
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      setError('La quantité doit être un nombre entier positif.');
      return;
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      setError("Le prix d'acquisition doit être un nombre positif (MAD).");
      return;
    }
    const payload = {
      symbol: values.symbol,
      quantity,
      purchasePrice,
      purchasedAt: values.purchasedAt,
    };
    if (position) {
      updatePosition(position.id, payload);
    } else {
      addPosition(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{position ? 'Modifier la position' : 'Ajouter une position'}</DialogTitle>
          <DialogDescription>
            Renseignez la valeur, la quantité acquise et le prix d'acquisition unitaire (PRU).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="symbol">Action</Label>
            <Select value={symbol} onValueChange={(v) => setValue('symbol', v)}>
              <SelectTrigger id="symbol">
                <SelectValue placeholder="Choisir une valeur" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_UNIVERSE.map((s) => (
                  <SelectItem key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                inputMode="numeric"
                placeholder="ex. 100"
                {...register('quantity')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrice">PRU (MAD)</Label>
              <Input
                id="purchasePrice"
                inputMode="decimal"
                placeholder="ex. 95,50"
                {...register('purchasePrice')}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchasedAt">Date d'acquisition</Label>
            <Input id="purchasedAt" type="date" {...register('purchasedAt')} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{position ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
