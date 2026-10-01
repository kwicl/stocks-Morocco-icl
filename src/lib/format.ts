/**
 * Utilitaires de formatage — marché marocain (MAD, locale fr-MA).
 */

const madFormatter = new Intl.NumberFormat('fr-MA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat('fr-MA', {
  maximumFractionDigits: 0,
});

/** Formate un montant en dirhams : "1 234,56 MAD" */
export function formatMAD(value: number, withCurrency = true): string {
  const formatted = madFormatter.format(value);
  return withCurrency ? `${formatted} MAD` : formatted;
}

/** Formate un montant signé avec couleur implicite : "+1 234,56 MAD" / "-1 234,56 MAD" */
export function formatSignedMAD(value: number, withCurrency = true): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatMAD(Math.abs(value), withCurrency)}`;
}

/** Formate un pourcentage : "+1,25 %" */
export function formatPct(value: number, signed = true): string {
  const sign = signed && value > 0 ? '+' : '';
  return `${sign}${madFormatter.format(value)} %`;
}

/** Formate un entier (quantités, volumes) */
export function formatInt(value: number): string {
  return intFormatter.format(value);
}

/** Formate un volume en titres */
export function formatVolume(value: number): string {
  return intFormatter.format(Math.round(value));
}

/** Horodatage HH:mm:ss */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
