import { useState } from 'react';
import { AssetAnalysis } from '../components/AiReport';
import { AssetLogo, ErrorState, PageHeader, Skeleton } from '../components/ui';
import { useData } from '../context/DataContext';

export default function Research() {
  const { assets, loading, error, refresh } = useData();
  const [symbol, setSymbol] = useState<string | null>(null);
  const chosen = symbol ?? assets[0]?.symbol ?? null;
  return (
    <>
      <PageHeader title="AI research" sub="Pick a PreStock. The server sends its live API data to the model and returns a structured report with PreStocks facts, AI interpretation and missing data kept apart." />
      {loading && <Skeleton className="h-24 w-full" />}
      {!loading && assets.length === 0 && <ErrorState title="PreStocks data is unavailable" message={error ?? 'No assets returned.'} onRetry={refresh} />}
      {assets.length > 0 && chosen && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a PreStock">
            {assets.map((a) => (
              <button key={a.symbol} role="radio" aria-checked={chosen === a.symbol} onClick={() => setSymbol(a.symbol)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${chosen === a.symbol ? 'border-ai bg-ai-tint text-ai' : 'border-line bg-white hover:bg-paper'}`}>
                <AssetLogo asset={a} size={20} />{a.symbol}
              </button>
            ))}
          </div>
          <AssetAnalysis symbol={chosen} />
        </div>
      )}
    </>
  );
}
