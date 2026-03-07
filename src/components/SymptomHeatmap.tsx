import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { SymptomRating } from '@/types/pandas';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SymptomDayDetails from './SymptomDayDetails';

const SymptomHeatmap: React.FC = () => {
  const { childProfile, symptoms } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomRating[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const days: (string | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day).toISOString().split('T')[0]);
    }
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') newMonth.setMonth(newMonth.getMonth() - 1);
    else newMonth.setMonth(newMonth.getMonth() + 1);
    const limit = new Date();
    limit.setMonth(limit.getMonth() - 12);
    if (direction === 'prev' && newMonth < limit) return;
    if (direction === 'next' && newMonth > new Date()) return;
    setCurrentMonth(newMonth);
  };

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];
  const monthSymptoms = symptoms.filter((s) => s.date >= monthStart && s.date <= monthEnd);

  const getDayIntensity = (date: string) => {
    const daySymptoms = monthSymptoms.filter((s) => s.date === date);
    if (daySymptoms.length === 0) return 0;
    return Math.round(daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length);
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-neutral-100 dark:bg-neutral-800';
    if (intensity <= 2) return 'bg-success-100';
    if (intensity <= 4) return 'bg-warning-50';
    if (intensity <= 6) return 'bg-warning-100';
    if (intensity <= 8) return 'bg-danger-100';
    return 'bg-danger-200';
  };

  const handleDayClick = (date: string) => {
    const daySymptoms = monthSymptoms.filter((s) => s.date === date);
    setSelectedDate(date);
    setSelectedSymptoms(daySymptoms);
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-4xl mb-3">🗓️</p>
          <p className="font-serif text-xl text-neutral-700 dark:text-neutral-200 mb-2">No Child Selected</p>
          <p className="font-sans text-[13px] text-neutral-400">Select a child profile to view heatmap</p>
        </CardContent>
      </Card>
    );
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.07em] m-0">
              Symptom Heatmap
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-sans font-bold text-[12px] text-neutral-700 dark:text-neutral-200 min-w-[110px] text-center">{monthYear}</span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((d, i) => (
              <div key={i} className="text-center font-sans text-[9px] font-bold text-neutral-400 py-0.5">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) return <div key={index} className="aspect-square" />;
              const intensity = getDayIntensity(date);
              const dayOfMonth = new Date(date).getDate();
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div
                  key={date}
                  onClick={() => handleDayClick(date)}
                  className={`aspect-square rounded-[4px] flex items-center justify-center font-mono text-[10px] cursor-pointer transition-all ${getIntensityColor(intensity)} ${isToday ? 'ring-2 ring-primary-400' : ''}`}
                >
                  {dayOfMonth}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2.5 mt-3 justify-center flex-wrap">
            {[
              ['bg-neutral-100 dark:bg-neutral-800', 'None'],
              ['bg-success-100', 'Mild'],
              ['bg-warning-100', 'Moderate'],
              ['bg-danger-100', 'Flare'],
              ['bg-danger-200', 'Peak'],
            ].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                <span className="font-sans text-[10px] text-neutral-400">{l}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedDate !== null} onOpenChange={() => { setSelectedDate(null); setSelectedSymptoms([]); }}>
        <DialogContent className="max-w-lg">
          {selectedDate && (
            <SymptomDayDetails
              date={selectedDate}
              symptoms={selectedSymptoms}
              onClose={() => { setSelectedDate(null); setSelectedSymptoms([]); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SymptomHeatmap;
