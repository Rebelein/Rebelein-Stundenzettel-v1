"use client";

import { useMemo } from 'react';
import type { TimeEntry, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDaysInMonth, getDay, startOfMonth } from 'date-fns';
import { AnalysisCalendar } from './analysis-calendar';

interface WorkHoursAnalysisProps {
  entries: TimeEntry[];
  user: User;
  currentDate: Date;
}

export function WorkHoursAnalysis({ entries, user, currentDate }: WorkHoursAnalysisProps) {
  const { totalActualHours, totalTargetHours } = useMemo(() => {
    let totalActualHours = 0;
    let totalTargetHours = 0;

    if (user && currentDate) {
      totalActualHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

      const daysInMonth = getDaysInMonth(currentDate);
      const monthStart = startOfMonth(currentDate);

      const weekdayMap: (keyof User['targetHours'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i);
        const dayOfWeek = getDay(date); // 0=Sun, 1=Mon...
        
        if (dayOfWeek >= 1 && dayOfWeek <= 5 && user.targetHours) { // Monday to Friday
          totalTargetHours += user.targetHours[weekdayMap[dayOfWeek-1]] || 0;
        }
      }
    }

    return { totalActualHours, totalTargetHours };
  }, [entries, user, currentDate]);

  const difference = totalActualHours - totalTargetHours;
  const differenceColor = difference >= 0 ? 'text-green-600' : 'text-red-600';
  const differenceSign = difference >= 0 ? '+' : '';

  return (
    <div className="space-y-8 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Monatsauswertung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-muted-foreground">Soll</p>
              <p className="text-2xl font-bold">{totalTargetHours.toFixed(2)}h</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-muted-foreground">Ist</p>
              <p className="text-2xl font-bold">{totalActualHours.toFixed(2)}h</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-muted-foreground">Differenz</p>
              <p className={`text-2xl font-bold ${differenceColor}`}>
                {differenceSign}
                {difference.toFixed(2)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
         <CardHeader>
          <CardTitle>Kalender</CardTitle>
        </CardHeader>
        <CardContent>
            <AnalysisCalendar 
                entries={entries}
                user={user}
                currentDate={currentDate}
            />
        </CardContent>
      </Card>
    </div>
  );
}
