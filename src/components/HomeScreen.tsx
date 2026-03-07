import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { TrendingUp, Pill, FileText, Zap } from 'lucide-react';

interface HomeScreenProps {
  onQuickLog: () => void;
  onNavigate: (tab: string) => void;
}

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: 'Trends', sub: '7-day chart', tab: 'chart' },
  { icon: Pill, label: 'Treatments', sub: 'Medications', tab: 'treatment' },
  { icon: FileText, label: 'Doctor Report', sub: 'Export PDF', tab: 'export' },
  { icon: Zap, label: 'Triggers', sub: 'Correlations', tab: 'triggers' },
];

function getSeverityColor(sev: number): string {
  if (sev <= 2) return 'text-success-500';
  if (sev <= 4) return 'text-success-400';
  if (sev <= 6) return 'text-warning-400';
  if (sev <= 8) return 'text-danger-400';
  return 'text-danger-500';
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onQuickLog, onNavigate }) => {
  const { childProfile, symptoms } = useApp();

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

  const SUMMARY_STATS = [
    { label: 'Avg Today', value: String(avgToday), unit: '/10', color: 'text-success-400' },
    { label: 'Entries', value: String(todaySymptoms.length), unit: ' logged', color: 'text-white/90' },
    { label: 'Days Tracked', value: String(daysTracked), unit: ' total', color: 'text-white/90' },
  ];

  const childName = childProfile?.name ?? 'your child';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto pb-20">
      {/* Hero banner */}
      <div
        className="p-5 pb-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }}
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <p className="font-sans text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {today}
        </p>
        <h1 className="font-serif text-[26px] text-white mb-3.5">
          Good morning{childName !== 'your child' ? `, ${childName}'s team` : ''} 👋
        </h1>
        <div className="grid grid-cols-3 gap-2">
          {SUMMARY_STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl p-2.5 text-center bg-white/[0.12]">
              <p className={`font-mono text-lg mb-0.5 font-medium ${stat.color}`}>
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

      <div className="p-4 pt-4">
        {/* Quick log CTA */}
        <button
          onClick={onQuickLog}
          className="w-full p-4 rounded-2xl border-0 flex items-center justify-between cursor-pointer mb-3.5"
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

        {/* Recent entries */}
        <Card className="mb-3.5">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-sans font-extrabold text-[12px] text-neutral-500 uppercase tracking-[0.07em] m-0">
                Recent Entries
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-500 font-bold text-xs p-0 h-auto"
                onClick={() => onNavigate('symptoms')}
              >
                See all ›
              </Button>
            </div>

            {recentSymptoms.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-2">No entries yet today.</p>
            ) : (
              recentSymptoms.map((entry, i) => (
                <div
                  key={entry.id}
                  onClick={() => onNavigate('symptoms')}
                  className={`flex items-center gap-2.5 py-2.5 cursor-pointer ${
                    i > 0 ? 'border-t border-neutral-50' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center text-[17px] shrink-0">
                    🔍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-sans font-bold text-[13px] text-neutral-700 m-0 truncate">
                        {entry.symptomType}
                      </p>
                      {entry.isImportant && <span className="text-[11px]">⭐</span>}
                    </div>
                    <p className="font-sans text-[11px] text-neutral-400 m-0">{entry.date}</p>
                  </div>
                  <div className="rounded-lg px-2 py-0.5 bg-neutral-100">
                    <span className={`font-mono text-[11px] font-medium ${getSeverityColor(entry.severity)}`}>
                      {entry.severity}/10
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick access grid */}
        <p className="font-sans font-extrabold text-[12px] text-neutral-500 uppercase tracking-[0.07em] mb-2">
          Quick Access
        </p>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {QUICK_ACTIONS.map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer hover:shadow-md transition-shadow select-none"
              onClick={() => onNavigate(action.tab)}
            >
              <CardContent className="p-3 flex items-center gap-2.5">
                <action.icon className="w-5 h-5 text-primary-500 shrink-0" />
                <div>
                  <p className="font-sans font-extrabold text-[13px] text-neutral-700 m-0">
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
