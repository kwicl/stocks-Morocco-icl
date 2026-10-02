/**
 * Horaires de séance de la Bourse de Casablanca.
 * Séance continue : lundi–vendredi, ~09:30 → 15:35 (heure de Casablanca).
 * Hors de cette plage, les cotations ne bougent plus (cours de clôture).
 */

const TZ = 'Africa/Casablanca';
const OPEN_MIN = 9 * 60 + 30; // 09:30
const CLOSE_MIN = 15 * 60 + 35; // 15:35

function casablancaTime(date: Date): { weekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    weekday: get('weekday'),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** La séance est-elle en cours à l'instant donné ? */
export function isBvcOpen(date: Date = new Date()): boolean {
  const { weekday, minutes } = casablancaTime(date);
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  return minutes >= OPEN_MIN && minutes <= CLOSE_MIN;
}

/** Libellé d'état du marché pour l'UI */
export function marketStatusLabel(date: Date = new Date()): string {
  return isBvcOpen(date) ? 'Marché ouvert' : 'Marché fermé — cours de clôture';
}
