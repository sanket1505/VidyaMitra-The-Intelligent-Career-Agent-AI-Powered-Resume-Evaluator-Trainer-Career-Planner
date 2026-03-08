import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Globe, DollarSign, Newspaper, ExternalLink, TrendingUp, Loader2, RefreshCw } from 'lucide-react';

interface MarketData {
  domain: string;
  news: { title: string; url: string; source: string }[];
  exchange_rate: { currency_pair: string; rate: number } | null;
}

export default function MarketInsights({ domain = 'Technology' }: { domain?: string }) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await api.get(`/market/insights?domain=${encodeURIComponent(domain)}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch market insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchInsights(false);
  }, [domain]);

  if (loading) {
    return (
      <section className="surface-card flex min-h-[280px] flex-col items-center justify-center p-6">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-sky-400" />
        <p className="text-sm text-slate-400">Scanning global markets...</p>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
          <Globe className="h-5 w-5 text-sky-300" />
          Global Market Insights
        </h2>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-700/70 bg-slate-900/45 px-3 py-1 text-xs text-slate-300">{domain}</span>
          <button onClick={() => void fetchInsights(true)} className="btn-secondary h-9 w-9 px-0" title="Refresh insights">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-sky-300' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {data.exchange_rate?.rate && (
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/12 to-cyan-500/10 p-4">
            <div className="absolute right-3 top-3 text-emerald-300/20">
              <DollarSign className="h-10 w-10" />
            </div>
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> Live Exchange
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">INR {data.exchange_rate.rate.toFixed(2)}</span>
              <span className="text-sm text-slate-400">/ 1 USD</span>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-300">
            <Newspaper className="h-4 w-4 text-slate-400" />
            Latest Industry News
          </h3>

          {data.news.length > 0 ? (
            <div className="space-y-3">
              {data.news.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-card-soft interactive-card block p-3"
                >
                  <h4 className="line-clamp-2 text-sm font-medium text-slate-200">{article.title}</h4>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">{article.source}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-800/30 p-4 text-center text-sm italic text-slate-500">No recent news found for this domain.</p>
          )}
        </div>
      </div>
    </section>
  );
}

