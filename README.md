# Casablanca Stock Portfolio (Maroc Bourse Tracker)

Application web (PWA) de suivi de la Bourse de Casablanca : cotations en temps réel, gestion de portefeuille personnel et simulateur de cession aux frais du marché marocain (BVC).

**Valeurs suivies** : Maroc Telecom (IAM), TGCC (TGC), SGTM (GTM), Risma (RIS), CIH Bank (CIH).

## Fonctionnalités

- **Cours en direct** : dernier cours, variation (MAD et %), ouverture, plus haut / plus bas, volume, montant échangé, sparklines intrajournaliers, indice MASI indicatif.
- **Mon Portefeuille** : ajout / modification / suppression de positions (quantité, PRU, date), valorisation en temps réel, plus/moins-value latente (MAD et %), persistance locale (localStorage).
- **Simulateur de cession** : vente partielle ou totale, commission de courtage HT paramétrable, TVA 10 % sur commissions, TPC 15 % sur la plus-value nette, calcul du **net à recevoir** et de la plus/moins-value nette réalisée.
- **Analyses** : répartition du portefeuille (donut) et performance par position (barres).
- **PWA installable** : iOS (Ajouter à l'écran d'accueil) et Android — ouverture plein écran comme une application native, icônes dédiées, fonctionnement hors-ligne (service worker).
- Mode sombre / clair, interface responsive (barre de navigation inférieure style app sur mobile).

## Stack technique

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Zustand (persist) · Recharts · vite-plugin-pwa (Workbox)

## Démarrage

```bash
npm install
npm run dev      # développement — http://localhost:3000
npm run build    # build de production → dist/
npm run preview  # prévisualisation du build
```

## Architecture des données de marché

La couche cotations est isolée derrière le contrat `MarketDataProvider` (`src/lib/market/`) :

- `SimulatedMarketProvider` (défaut) : moteur de démonstration (random walk) calé sur les dernières clôtures publiées.
- `HttpMarketProvider` : prêt à brancher sur un proxy backend exposant `GET /api/quotes` (polling) — la Bourse de Casablanca ne publiant pas d'API publique gratuite, un flux réel nécessite une source de données licenciée côté serveur.

Aucune vue React ne dépend de l'implémentation : basculer du mode simulé au flux réel se fait dans `src/lib/market/provider.ts`.

## Avertissement

Outil indicatif fourni à titre de démonstration — les cotations par défaut sont simulées et les calculs de frais (courtage, TVA, TPC) sont des estimations qui dépendent de votre société de bourse et de votre situation fiscale. Ne constitue pas un conseil en investissement.
