import { useEffect, useState } from 'react';
import { LineChart, Moon, Sun, Landmark, Wallet, PieChart } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MarketWatch } from '@/sections/MarketWatch';
import { PortfolioView } from '@/sections/PortfolioView';
import { AnalysisView } from '@/sections/AnalysisView';
import { cn } from '@/lib/utils';

type Theme = 'dark' | 'light';
type TabValue = 'market' | 'portfolio' | 'analysis';

const NAV_ITEMS: { value: TabValue; label: string; icon: typeof LineChart }[] = [
  { value: 'market', label: 'Cours', icon: LineChart },
  { value: 'portfolio', label: 'Portefeuille', icon: Wallet },
  { value: 'analysis', label: 'Analyses', icon: PieChart },
];

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('csp-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [tab, setTab] = useState<TabValue>('market');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('csp-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barre supérieure (safe-area pour l'encoche iPhone) */}
      <header className="safe-top sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">
                Casablanca Stock Portfolio
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Maroc Bourse Tracker — Bourse de Casablanca
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation par onglets — tablette & desktop */}
            <nav className="hidden items-center gap-1 rounded-full border bg-muted/50 p-1 sm:flex">
              {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                    tab === value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
            <Button
              variant="outline"
              size="icon"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu principal — espace réservé en bas pour la barre mobile */}
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:pb-6 sm:pt-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsContent value="market" className="mt-0">
            <MarketWatch />
          </TabsContent>
          <TabsContent value="portfolio" className="mt-0">
            <PortfolioView />
          </TabsContent>
          <TabsContent value="analysis" className="mt-0">
            <AnalysisView />
          </TabsContent>
        </Tabs>

        <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground">
          <p>
            Données affichées à titre de démonstration : cotations simulées à partir des dernières
            clôtures publiées (30/09/2026). L'architecture (contrat <code>MarketDataProvider</code>)
            est prête pour le branchement d'un flux réel via un proxy backend. Vos positions sont
            stockées localement dans ce navigateur (localStorage) — elles ne sont synchronisées ni
            entre appareils, ni conservées si vous effacez les données du site.
          </p>
          <p className="mt-1">Outil indicatif — ne constitue pas un conseil en investissement.</p>
        </footer>
      </main>

      {/* Barre de navigation inférieure — mobile uniquement (style app native) */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur sm:hidden">
        <div className="grid grid-cols-3">
          {NAV_ITEMS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                tab === value
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', tab === value && 'stroke-[2.4]')} />
              {label}
              <span
                className={cn(
                  'h-1 w-1 rounded-full',
                  tab === value ? 'bg-emerald-500' : 'bg-transparent',
                )}
              />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
