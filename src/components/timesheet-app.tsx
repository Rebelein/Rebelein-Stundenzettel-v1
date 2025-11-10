"use client";

import { useState, useEffect } from 'react';
import type { User, TimeEntry } from '@/lib/types';
import { users, initialEntries } from '@/lib/data';
import { TimeEntryForm } from './time-entry-form';
import { MonthlyOverview } from './monthly-overview';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileClock,
} from 'lucide-react';

export function TimesheetApp() {
  const [allEntries, setAllEntries] = useState<TimeEntry[]>(initialEntries);
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const userEntries = allEntries.filter((e) => e.userId === selectedUserId);

  const addEntry = (newEntry: {
    date: Date;
    customer: string;
    hours: number;
  }) => {
    if (!selectedUserId) return;
    const entry: TimeEntry = {
      ...newEntry,
      id: `e${Date.now()}`,
      date: newEntry.date.toISOString().split('T')[0],
      userId: selectedUserId,
    };
    setAllEntries((prev) => [...prev, entry]);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const changeMonth = (amount: number) => {
    setCurrentDate(prevDate => {
      if (!prevDate) return new Date();
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const formattedMonth = currentDate?.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) || '';

  if (!currentDate) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="no-print flex flex-col gap-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-2xl md:text-3xl font-headline font-bold">
            <FileClock className="h-8 w-8 text-primary" />
            <h1>Stundenzettel Meister</h1>
          </div>
          <div className="flex items-center gap-4">
             <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Benutzer auswählen" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Download className="h-4 w-4" />
              <span className="sr-only">PDF Herunterladen</span>
            </Button>
          </div>
        </header>

        <TimeEntryForm addEntry={addEntry} />
        
        <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium font-headline w-48 text-center">{formattedMonth}</span>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="mt-[-100vh] print:mt-0">
        <MonthlyOverview
          entries={userEntries}
          user={selectedUser}
          currentDate={currentDate}
        />
      </div>
    </div>
  );
}
