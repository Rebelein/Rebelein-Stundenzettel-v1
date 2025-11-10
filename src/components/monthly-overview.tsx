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
  
  const daysWithEntries = allDays.filter(day => entries.some(e => e.date === day.toISOString().split('T')[0]));


  // --- Print layout for larger screens ---
  const printPages = [];
  for (let i = 0; i < daysWithEntries.length; i += 2) {
      printPages.push([daysWithEntries[i], daysWithEntries[i+1]].filter(Boolean));
  }


  return (
    <>
      {/* Mobile-friendly stacked view */}
      <div className="md:hidden space-y-4 py-4">
        {daysWithEntries.map(day => (
          <TimesheetDay
            key={day.toISOString()}
            date={day}
            user={user}
            entries={entries.filter(e => e.date === day.toISOString().split('T')[0])}
          />
        ))}
      </div>

      {/* Print-oriented A4 pages for md screens and up */}
      <div id="print-area" className="hidden md:block py-4 md:py-8">
        {printPages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-page-container mx-auto my-4 md:my-8 bg-gray-300 shadow-2xl relative scale-[0.6] lg:scale-[0.8] xl:scale-100 origin-top"
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
                    left: dayIndex === 0 ? '0' : '148mm',
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
    </>
  );
}
