/**
 * Moteur de calcul des frais et taxes applicables aux cessions d'actions
 * sur la Bourse de Casablanca (marché au comptant, investisseur particulier
 * personne physique résidente — hypothèse par défaut).
 *
 * Paramètres réglementaires usuels (éditables dans l'UI) :
 *  - Commission de courtage : taux HT variable selon la société de bourse
 *    (fourchette usuelle ~0,3 % à 0,6 % HT), parfois avec un minimum de perception.
 *  - TVA sur commissions : 10 % (appliquée sur la commission de courtage HT).
 *  - TPC — Taxe sur les Profits de Cession de valeurs mobilières cotées :
 *    retenue à la source de 15 % sur le profit net de cession réalisé par
 *    une personne physique (régime IR, titres cotés). La taxe n'est due
 *    qu'en cas de plus-value ; les moins-values ne donnent pas lieu à TPC.
 *
 * NB : ce simulateur est fourni à titre indicatif — le calcul exact dépend
 * du courtier (minima, frais fixes, droits de garde éventuels) et de la
 * situation fiscale de l'investisseur.
 */

export interface FeeParams {
  /** Taux de commission de courtage HT (ex. 0,004 = 0,4 %) */
  brokerageRate: number;
  /** Commission minimale par ordre en MAD (0 = pas de minimum) */
  minCommission: number;
  /** TVA applicable aux commissions (0,10 = 10 %) */
  vatRate: number;
  /** Taux de TPC sur la plus-value (0,15 = 15 %) */
  tpcRate: number;
  /** Appliquer la TPC (décochable pour simuler un autre régime) */
  applyTpc: boolean;
}

export const DEFAULT_FEE_PARAMS: FeeParams = {
  brokerageRate: 0.004, // 0,4 % HT
  minCommission: 0,
  vatRate: 0.1, // TVA 10 %
  tpcRate: 0.15, // TPC 15 %
  applyTpc: true,
};

export interface SaleSimulationInput {
  quantity: number;
  /** Cours de cession unitaire (MAD) */
  salePrice: number;
  /** Prix d'acquisition unitaire (MAD) */
  purchasePrice: number;
  fees: FeeParams;
}

export interface SaleSimulationResult {
  quantity: number;
  salePrice: number;
  /** Montant brut de la cession (qté × cours) */
  grossAmount: number;
  /** Commission de courtage HT (après minimum éventuel) */
  commissionHT: number;
  /** TVA sur la commission */
  vat: number;
  /** Coût d'acquisition de la quantité vendue */
  costBasis: number;
  /** Plus/Moins-value brute sur la quantité vendue */
  grossPnl: number;
  /** TPC retenue (15 % de la plus-value nette de frais, si positive) */
  tpc: number;
  /** Total des frais et taxes prélevés */
  totalFees: number;
  /** Montant net encaissé */
  netReceived: number;
  /** Plus/Moins-value nette réalisée (net encaissé − coût d'acquisition) */
  netPnl: number;
  /** Performance nette en % du coût d'acquisition */
  netPnlPct: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function simulateSale(input: SaleSimulationInput): SaleSimulationResult {
  const { quantity, salePrice, purchasePrice, fees } = input;

  const grossAmount = quantity * salePrice;
  const rawCommission = grossAmount * fees.brokerageRate;
  const commissionHT =
    fees.minCommission > 0 && grossAmount > 0
      ? Math.max(rawCommission, fees.minCommission)
      : rawCommission;
  const vat = commissionHT * fees.vatRate;

  const costBasis = quantity * purchasePrice;
  const grossPnl = grossAmount - costBasis;

  // Assiette TPC : plus-value nette des frais de cession, si positive
  const taxableGain = Math.max(0, grossAmount - commissionHT - vat - costBasis);
  const tpc = fees.applyTpc ? taxableGain * fees.tpcRate : 0;

  const totalFees = commissionHT + vat + tpc;
  const netReceived = grossAmount - totalFees;
  const netPnl = netReceived - costBasis;
  const netPnlPct = costBasis > 0 ? (netPnl / costBasis) * 100 : 0;

  return {
    quantity,
    salePrice,
    grossAmount: round2(grossAmount),
    commissionHT: round2(commissionHT),
    vat: round2(vat),
    costBasis: round2(costBasis),
    grossPnl: round2(grossPnl),
    tpc: round2(tpc),
    totalFees: round2(totalFees),
    netReceived: round2(netReceived),
    netPnl: round2(netPnl),
    netPnlPct: round2(netPnlPct),
  };
}
