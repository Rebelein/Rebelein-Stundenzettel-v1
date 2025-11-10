"use client";

import type { TimeEntry, User } from '@/lib/types';
import { TimesheetDay } from './timesheet-day';

interface MonthlyOverviewProps {
  entries: TimeEntry[];
  user: User | undefined;
  currentDate: Date;
}

export function MonthlyOverview({
  entries,
  user,
  currentDate,
}: MonthlyOverviewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  const monthEntries = allDays.map(day => {
    return entries.filter(
      (e) => e.date === day.toISOString().split('T')[0]
    );
  }).flat();
  
  if (monthEntries.length === 0) {
     return <p className="text-center text-muted-foreground mt-10">Keine Daten für den ausgewählten Monat.</p>;
  }

  const pages = [];
  for (let i = 0; i < allDays.length; i += 2) {
    const day1 = allDays[i];
    const day2 = allDays[i + 1];

    const hasEntriesDay1 = day1 && entries.some(e => e.date === day1.toISOString().split('T')[0]);
    const hasEntriesDay2 = day2 && entries.some(e => e.date === day2.toISOString().split('T')[0]);

    if (hasEntriesDay1 || hasEntriesDay2) {
      pages.push([day1, day2].filter(Boolean));
    }
  }


  return (
    <div id="print-area" className="py-4 md:py-8">
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="a4-page-container mx-auto my-4 md:my-8 bg-gray-300 shadow-2xl relative scale-[0.4] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 origin-top"
          style={{ 
            width: '210mm', 
            height: '297mm',
          }}
        >
          {page.map((day, dayIndex) => {
             // Find the correct index for positioning (0 for left, 1 for right)
             // This depends on whether the first day of the page is an even or odd day of the month
            const isFirstDayEven = page[0].getDate() % 2 !== 0;
            let positionIndex = dayIndex;
            if (isFirstDayEven) {
                positionIndex = day.getDate() % 2 === 0 ? 1 : 0;
            } else {
                positionIndex = day.getDate() % 2 === 0 ? 0 : 1;
            }
            if (page.length === 1) positionIndex = 0;


            const dayEntries = entries.filter(
              (e) => e.date === day.toISOString().split('T')[0]
            );

            // Don't render a sheet if there are no entries for that day, unless it's a pair
            if (dayEntries.length === 0 && page.length > 1) {
              const otherDayHasEntries = page.some((d, i) => i !== dayIndex && entries.some(e => e.date === d.toISOString().split('T')[0]));
              if (!otherDayHasEntries) return null;
            }


            return (
              <div 
                key={day.toISOString()} 
                className="absolute"
                style={{
                  top: '0',
                  left: positionIndex === 0 ? '0' : '148mm',
                  width: '148mm',
                  height: '210mm'
                }}
              >
                <TimesheetDay
                  date={day}
                  user={user}
                  entries={dayEntries}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
