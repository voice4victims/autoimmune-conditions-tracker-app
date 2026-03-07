import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import SymptomChart from './SymptomChart';
import SymptomHeatmap from './SymptomHeatmap';

function sevColor(n: number): string {
  if (n <= 2) return '#28BC79';
  if (n <= 4) return '#3CB371';
  if (n <= 6) return '#F5A81A';
  if (n <= 8) return '#FF4545';
  return '#E82020';
}

interface TrendsScreenProps {
  onOpenMore: (tab: string) => void;
}

const TrendsScreen: React.FC<TrendsScreenProps> = ({ onOpenMore }) => {
  const { childProfile, symptoms } = useApp();
  const [view, setView] = useState<'chart' | 'heatmap'>('chart');
  const [range, setRange] = useState('30d');

  const now = new Date();
  const daysBack = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const rangeSymptoms = symptoms.filter((s) => s.date >= cutoffStr);
  const allDates = [...new Set(rangeSymptoms.map((s) => s.date))].sort();

  const dailyAvgs = allDates.map((date) => {
    const daySym = rangeSymptoms.filter((s) => s.date === date);
    return daySym.reduce((sum, s) => sum + s.severity, 0) / daySym.length;
  });

  const avg = dailyAvgs.length > 0
    ? (dailyAvgs.reduce((a, b) => a + b, 0) / dailyAvgs.length).toFixed(1)
    : '—';
  const trend = dailyAvgs.length >= 2
    ? dailyAvgs[dailyAvgs.length - 1] - dailyAvgs[0]
    : 0;
  const flareCount = dailyAvgs.filter((v) => v >= 7).length;
  const avgNum = parseFloat(avg) || 0;

  const KPI_ITEMS = [
    { l: 'Avg Severity', v: avg, u: '/10', c: sevColor(avgNum) },
    { l: 'High Days', v: String(flareCount), u: ' days', c: '#FF4545' },
    {
      l: 'Trend',
      v: trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1),
      u: '',
      c: trend > 0 ? '#FF4545' : '#28BC79',
    },
  ];

  const Sparkline: React.FC<{ data: number[]; color?: string; height?: number }> = ({
    data,
    color = '#1F8DB5',
    height = 70,
  }) => {
    if (data.length < 2) return null;
    const w = 340;
    const h = height;
    const pad = 4;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
      return `${x},${y}`;
    });
    const area = `M${pts[0]} L${pts.join(' L')} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#spark-grad)" />
        <polyline
          points={pts.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-neutral-900 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center shrink-0">
        <div>
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-neutral-400 mb-0.5">
            {childProfile?.name ?? 'Child'} · {range} view
          </p>
          <h2 className="font-serif text-[22px] text-neutral-800 dark:text-neutral-100 m-0 tracking-[-0.2px]">Trends</h2>
        </div>
        <button
          onClick={() => onOpenMore('email')}
          className="bg-primary-50 border-[1.5px] border-primary-200 rounded-xl px-3 py-1.5 font-sans font-extrabold text-[12px] text-primary-600 cursor-pointer"
        >
          📄 Export
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3.5">
        <div className="flex gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5">
          {([['7d', '7 Days'], ['14d', '14 Days'], ['30d', '30 Days']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={cn(
                'flex-1 py-2 rounded-lg border-none font-sans font-extrabold text-[12px] cursor-pointer transition-all',
                range === v
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm'
                  : 'bg-transparent text-neutral-400'
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {KPI_ITEMS.map((k) => (
            <Card key={k.l}>
              <CardContent className="p-3 text-center">
                <p className="font-mono text-xl mb-0.5 font-medium" style={{ color: k.c }}>
                  {k.v}
                  <span className="text-[10px] text-neutral-300">{k.u}</span>
                </p>
                <p className="font-sans text-[10px] text-neutral-400 m-0">{k.l}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {dailyAvgs.length >= 2 && (
          <Card>
            <CardContent className="p-4">
              <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-1.5">
                Overall Severity
              </p>
              <Sparkline data={dailyAvgs} color="#1F8DB5" height={70} />
              {allDates.length >= 2 && (
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[9px] text-neutral-300">{allDates[0]}</span>
                  <span className="font-mono text-[9px] text-neutral-300">
                    {allDates[allDates.length - 1]}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-0.5">
          {([['chart', 'Charts'], ['heatmap', 'Heatmap']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex-1 py-2 rounded-lg border-none font-sans font-extrabold text-[12px] cursor-pointer transition-all',
                view === v
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm'
                  : 'bg-transparent text-neutral-400'
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {view === 'chart' && <SymptomChart />}
        {view === 'heatmap' && <SymptomHeatmap />}

        {rangeSymptoms.length > 0 && flareCount > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'linear-gradient(135deg, #1F8DB5, #6E50C3)' }}
          >
            <p className="font-sans font-extrabold text-[10px] text-white/60 uppercase tracking-[0.07em] mb-1.5">
              🔬 Pattern Insight
            </p>
            <p className="font-serif text-[15px] text-white mb-1.5 leading-tight">
              {flareCount} high-severity day{flareCount > 1 ? 's' : ''} detected in {range} window
            </p>
            <p className="font-sans text-[11px] text-white/65 leading-relaxed m-0">
              Review trigger logs to identify correlations with flare periods. Discuss patterns with your care team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendsScreen;
