import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRetainedData } from '@/hooks/useRetainedData';
import RetentionBanner from './RetentionBanner';
import { format } from 'date-fns';

interface HomeScreenProps {
  onQuickLog: () => void;
  onNavigate: (tab: string) => void;
}

function sevColor(n: number): string {
  if (n <= 2) return '#28BC79';
  if (n <= 4) return '#3CB371';
  if (n <= 6) return '#F5A81A';
  if (n <= 8) return '#FF4545';
  return '#E82020';
}

const QUICK_ACTIONS = [
  { icon: '📈', label: 'Trends', sub: '7-day chart', tab: 'trends' },
  { icon: '💊', label: 'Treatments', sub: 'Medications', tab: 'log-treatment' },
  { icon: '📄', label: 'Doctor Report', sub: 'Export PDF', tab: 'records-email' },
  { icon: '⚡', label: 'Triggers', sub: 'Correlations', tab: 'log-triggers' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ onQuickLog, onNavigate }) => {
  const { childProfile, symptoms } = useRetainedData();

  const today = format(new Date(), 'EEEE, MMMM d');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todaySymptoms = symptoms.filter((s) => s.date === todayStr);
  const avgToday =
    todaySymptoms.length > 0
      ? (todaySymptoms.reduce((sum, s) => sum + s.severity, 0) / todaySymptoms.length).toFixed(1)
      : '—';

  const recentSymptoms = [...symptoms]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const daysTracked = new Set(symptoms.map((s) => s.date)).size;

  const childName = childProfile?.name ?? 'your child';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-24">
      <div
        className="p-5 pb-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <p className="font-sans text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {today}
        </p>
        <h1 className="font-serif text-[26px] text-white mb-3.5">
          {greeting}
          {childName !== 'your child' ? `, ${childName}'s team` : ''} 👋
        </h1>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'Avg Today',
              value: String(avgToday),
              unit: '/10',
              color: avgToday !== '—' ? sevColor(parseFloat(avgToday)) : 'rgba(255,255,255,0.9)',
            },
            {
              label: 'Entries',
              value: String(todaySymptoms.length),
              unit: ' logged',
              color: 'rgba(255,255,255,0.9)',
            },
            {
              label: 'Days Tracked',
              value: String(daysTracked),
              unit: ' total',
              color: 'rgba(255,255,255,0.9)',
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-2.5 text-center bg-white/[0.12]">
              <p className="font-mono text-lg mb-0.5 font-medium" style={{ color: stat.color }}>
                {stat.value}
                <span className="text-[10px] opacity-70">{stat.unit}</span>
              </p>
              <p className="font-sans text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <RetentionBanner onUpgrade={() => onNavigate('more-subscription')} />

      <div className="p-4 pt-4 space-y-3.5">
        <button
          onClick={onQuickLog}
          className="w-full p-4 rounded-2xl border-0 flex items-center justify-between cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #FF4545, #B81818)',
            boxShadow: '0 6px 20px rgba(232,32,32,0.35)',
          }}
        >
          <div className="text-left">
            <p className="font-sans font-extrabold text-[13px] text-white/80 mb-0.5 uppercase tracking-[0.06em]">
              Quick Log
            </p>
            <p className="font-serif text-lg text-white m-0">Record Flare Now</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-xl">
            🚀
          </div>
        </button>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-sans font-extrabold text-[12px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] m-0">
                Recent Entries
              </p>
              <button
                onClick={() => onNavigate('log')}
                className="font-sans text-[12px] text-primary-500 font-bold bg-transparent border-none cursor-pointer p-0"
              >
                See all ›
              </button>
            </div>

            {recentSymptoms.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-2">No entries yet.</p>
            ) : (
              recentSymptoms.map((entry, i) => (
                <div
                  key={entry.id}
                  onClick={() => onNavigate('log')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('log'); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${entry.symptomType}, severity ${entry.severity} out of 10, ${entry.date}`}
                  className={`flex items-center gap-2.5 py-2.5 cursor-pointer ${
                    i > 0 ? 'border-t border-neutral-50 dark:border-neutral-800' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-[17px] shrink-0">
                    🔍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-sans font-bold text-[13px] text-neutral-700 dark:text-neutral-200 m-0 truncate">
                        {entry.symptomType}
                      </p>
                    </div>
                    <p className="font-sans text-[11px] text-neutral-400 m-0">{entry.date}</p>
                  </div>
                  <div
                    className="rounded-lg px-2 py-0.5"
                    style={{ background: sevColor(entry.severity) + '20' }}
                  >
                    <span
                      className="font-mono text-[11px] font-medium"
                      style={{ color: sevColor(entry.severity) }}
                    >
                      {entry.severity}/10
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <p className="font-sans font-extrabold text-[12px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] mb-2">
          Quick Access
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_ACTIONS.map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer hover:shadow-md transition-shadow select-none"
              onClick={() => onNavigate(action.tab)}
            >
              <CardContent className="p-3 flex items-center gap-2.5">
                <span className="text-xl shrink-0">{action.icon}</span>
                <div>
                  <p className="font-sans font-extrabold text-[13px] text-neutral-700 dark:text-neutral-200 m-0">
                    {action.label}
                  </p>
                  <p className="font-sans text-[11px] text-neutral-400 m-0">{action.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
