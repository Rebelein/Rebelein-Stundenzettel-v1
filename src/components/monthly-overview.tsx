"use client";

import type { TimeEntry, User } from '@/lib/types';
import { TimesheetDay } from './timesheet-day';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';

interface MonthlyOverviewProps {
  entries: TimeEntry[];
  currentDate: Date;
  onEntrySelect: (entry: TimeEntry) => void;
  onEntryDelete: (entryId: string) => void;
}

export function MonthlyOverview({
  entries,
  onEntrySelect,
  onEntryDelete,
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
  
  const sortedDays = daysWithEntries.map(d => new Date(d)).sort((a,b) => a.getTime() - b.getTime());


  return (
    <>
      {/* Responsive tile view for screen */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8 py-4">
        {sortedDays.map(day => {
          const dayEntries = entries.filter(e => e.date === day.toISOString().split('T')[0]);
          return (
            <Card key={day.toISOString()}>
              <TimesheetDay
                date={day}
                entries={dayEntries}
                onEntrySelect={onEntrySelect}
                onEntryDelete={onEntryDelete}
              />
            </Card>
          )
        })}
      </div>
    </>
  );
}
