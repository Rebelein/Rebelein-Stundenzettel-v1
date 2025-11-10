"use client";

import type { TimeEntry, User } from '@/lib/types';
import { TimesheetDay } from './timesheet-day';
import { useMemo } from 'react';

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
  
  const daysWithEntries = useMemo(() => {
    const dayMap = new Map<string, TimeEntry[]>();
    entries.forEach(entry => {
        const day = entry.date;
        if (!dayMap.has(day)) {
            dayMap.set(day, []);
        }
        dayMap.get(day)!.push(entry);
    });
    return Array.from(dayMap.keys()).sort();
  }, [entries]);

  if (daysWithEntries.length === 0) {
     return <p className="text-center text-muted-foreground mt-10">Keine Daten für den ausgewählten Monat.</p>;
  }
  
  // --- Create data for print layout (hidden by default) ---
  const printPages: Date[][] = [];
  const sortedDays = daysWithEntries.map(d => new Date(d)).sort((a,b) => a.getTime() - b.getTime());

  for (let i = 0; i < sortedDays.length; i += 2) {
      printPages.push([sortedDays[i], sortedDays[i+1]].filter(Boolean));
  }


  return (
    <>
      {/* Responsive tile view for screen */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 py-4">
        {sortedDays.map(day => (
          <div key={day.toISOString()} className="border rounded-lg shadow-md overflow-hidden">
            <TimesheetDay
              date={day}
              user={user}
              entries={entries.filter(e => e.date === day.toISOString().split('T')[0])}
            />
          </div>
        ))}
      </div>

      {/* Print-oriented A4 pages, hidden from view but used for PDF generation */}
      <div id="print-area" className="hidden">
        {printPages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="a4-page-container mx-auto my-4 md:my-8 bg-white relative"
          >
            {page.map((day, dayIndex) => {
              const dayEntries = entries.filter(
                (e) => e.date === day.toISOString().split('T')[0]
              );

              return (
                <div 
                  key={day.toISOString()} 
                  className="a5-container absolute"
                  style={{
                    top: '0',
                    left: dayIndex === 0 ? '0' : '148mm',
                    border: '1px solid #ccc'
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
