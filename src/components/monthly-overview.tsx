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

  const pages = [];
  for (let i = 0; i < allDays.length; i += 2) {
    pages.push(allDays.slice(i, i + 2));
  }

  return (
    <div id="print-area" className="py-4 md:py-8">
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="a4-page-container mx-auto my-4 md:my-8 bg-gray-300 shadow-2xl relative scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.8] origin-top"
          style={{ 
            width: '210mm', 
            height: '297mm',
          }}
        >
          {page.map((day, dayIndex) => {
            const dayEntries = entries.filter(
              (e) => e.date === day.toISOString().split('T')[0]
            );
            return (
              <div 
                key={day.toISOString()} 
                className="absolute"
                style={{
                  top: '0',
                  left: dayIndex % 2 === 0 ? '0' : '148mm',
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
       {pages.length === 0 && (
          <p className="text-center text-muted-foreground mt-10">Keine Daten für den ausgewählten Monat.</p>
        )}
    </div>
  );
}
