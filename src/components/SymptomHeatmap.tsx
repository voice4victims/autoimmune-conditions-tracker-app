import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { symptomService } from '@/lib/firebaseService';
import { SymptomRating } from '@/types/pandas';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SymptomDayDetails from './SymptomDayDetails';

const SymptomHeatmap: React.FC = () => {
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState<SymptomRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomRating[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (childProfile) {
      fetchSymptoms();
    }
  }, [childProfile, currentMonth]);

  const fetchSymptoms = async () => {
    if (!childProfile) return;

    setLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const data = await symptomService.getSymptoms(user?.id || '', childProfile.id, startOfMonth, endOfMonth);

      const formattedSymptoms = (data || []).map(item => ({
        id: item.id,
        symptomType: item.symptom_type,
        severity: item.severity,
        date: item.date,
        notes: item.notes
      }));

      setSymptoms(formattedSymptoms);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load symptom data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date.toISOString().split('T')[0]);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }

    // Limit to 12 months back from today
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    if (direction === 'prev' && newMonth < twelveMonthsAgo) {
      return;
    }

    // Don't allow future months
    const today = new Date();
    if (direction === 'next' && newMonth > today) {
      return;
    }

    setCurrentMonth(newMonth);
  };

  const getDayIntensity = (date: string) => {
    const daySymptoms = symptoms.filter(s => s.date === date);
    if (daySymptoms.length === 0) return 0;
    const avgSeverity = daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length;
    return Math.round(avgSeverity);
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (intensity <= 2) return 'bg-green-200 hover:bg-green-300';
    if (intensity <= 4) return 'bg-yellow-200 hover:bg-yellow-300';
    if (intensity <= 6) return 'bg-orange-200 hover:bg-orange-300';
    if (intensity <= 8) return 'bg-red-200 hover:bg-red-300';
    return 'bg-red-400 hover:bg-red-500';
  };

  const handleDayClick = (date: string) => {
    const daySymptoms = symptoms.filter(s => s.date === date);
    setSelectedDate(date);
    setSelectedSymptoms(daySymptoms);
  };

  const handleCloseDetails = () => {
    setSelectedDate(null);
    setSelectedSymptoms([]);
  };

  const canNavigatePrev = () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    return currentMonth > twelveMonthsAgo;
  };

  const canNavigateNext = () => {
    const today = new Date();
    return currentMonth < today;
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Please select a child profile to view symptom heatmap</p>
        </CardContent>
      </Card>
    );
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Symptom Intensity Heatmap
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Click on any day to see detailed symptoms</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={!canNavigatePrev()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">{monthYear}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={!canNavigateNext()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading heatmap...</p>
            </div>
          ) : (
            <>
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="aspect-square"></div>;
                  }

                  const intensity = getDayIntensity(date);
                  const dayOfMonth = new Date(date).getDate();
                  const daySymptoms = symptoms.filter(s => s.date === date);
                  const isToday = date === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={date}
                      className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer ${getIntensityColor(intensity)
                        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                      title={`${date}: ${daySymptoms.length} symptoms, Avg severity ${intensity}/10`}
                      onClick={() => handleDayClick(date)}
                    >
                      {dayOfMonth}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-yellow-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-orange-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedDate !== null} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-2xl">
          {selectedDate && (
            <SymptomDayDetails
              date={selectedDate}
              symptoms={selectedSymptoms}
              onClose={handleCloseDetails}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SymptomHeatmap;