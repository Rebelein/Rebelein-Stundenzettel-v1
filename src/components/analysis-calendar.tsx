"use client";

import { useMemo } from 'react';
import type { TimeEntry, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getDaysInMonth, startOfMonth, format, getDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface AnalysisCalendarProps {
  entries: TimeEntry[];
  user: User;
  currentDate: Date;
}

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function AnalysisCalendar({ entries, user, currentDate }: AnalysisCalendarProps) {
  const { days, entriesByDate } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const numDays = getDaysInMonth(currentDate);
    const days = Array.from({ length: numDays }, (_, i) => {
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
        return date;
    });

    const entriesByDate = new Map<string, number>();
    entries.forEach(entry => {
      const day = entry.date;
      const currentHours = entriesByDate.get(day) || 0;
      entriesByDate.set(day, currentHours + entry.hours);
    });

    return { days, entriesByDate };
  }, [entries, currentDate]);

  const firstDayOfMonth = getDay(startOfMonth(currentDate)); // 0=Sun, 1=Mon, ..., 6=Sat
  // Adjust to start week on Monday
  const emptyCellsBefore = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

  const getTargetHoursForDay = (date: Date): number => {
    if (!user.targetHours) return 0;

    const dayOfWeek = getDay(date); // 0=Sun, 1=Mon...
    const weekdayMap: (keyof User['targetHours'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        return user.targetHours[weekdayMap[dayOfWeek-1]] || 0;
    }
    return 0; // No target hours for Saturday and Sunday
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-2">
        {weekDays.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: emptyCellsBefore }).map((_, index) => (
          <div key={`empty-${index}`} className="border rounded-md bg-gray-50 aspect-square"></div>
        ))}
        {days.map(day => {
          const dateString = format(day, 'yyyy-MM-dd');
          const actualHours = entriesByDate.get(dateString) || 0;
          const targetHours = getTargetHoursForDay(day);

          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          let dayBgClass = 'bg-white';
          if (actualHours > 0) {
              if (targetHours > 0 && actualHours >= targetHours) {
                  dayBgClass = 'bg-green-100';
              } else if (targetHours > 0) {
                  dayBgClass = 'bg-red-100';
              }
          } else if (targetHours > 0 && day < new Date() && !isToday) {
             dayBgClass = 'bg-red-100';
          }

          return (
            <div
              key={dateString}
              className={cn(
                'border rounded-md aspect-square p-1 flex flex-col text-xs',
                dayBgClass,
                isToday && 'border-2 border-blue-500'
              )}
            >
              <span className="font-bold text-gray-800 self-start">{format(day, 'd')}</span>
              {(actualHours > 0 || targetHours > 0) && (
                <div className="m-auto flex flex-col items-center justify-center text-center">
                    <span className={cn("font-bold text-sm", actualHours >= targetHours ? "text-green-700" : "text-red-700" )}>
                        {actualHours.toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-xs">/ {targetHours}h</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
