"use client";

import type { TimeEntry, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface TimesheetDayProps {
  date: Date;
  user: User | undefined;
  entries: TimeEntry[];
}

export function TimesheetDay({ date, user, entries }: TimesheetDayProps) {
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  const formattedDate = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="a5-sheet bg-white text-black p-6 flex flex-col shadow-lg transition-transform duration-300 hover:scale-[1.02] w-full h-full">
      <CardHeader className="p-0">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-2xl">Stundenzettel</CardTitle>
                <CardDescription className="text-muted-foreground">{user?.name || 'Kein Benutzer'}</CardDescription>
            </div>
            <p className="text-sm text-right text-gray-600">{formattedDate}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-grow mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-3/4">Kunde / Tätigkeit</TableHead>
              <TableHead className="text-right">Stunden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.customer}</TableCell>
                  <TableCell className="text-right">{entry.hours.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-500 py-10">
                  Keine Einträge für diesen Tag.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
             <TableRow>
                <TableCell className="font-bold">Gesamt</TableCell>
                <TableCell className="text-right font-bold">{totalHours.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>

      <CardFooter className="p-0 mt-auto pt-8">
        <div className="w-full">
            <Separator className="my-4 bg-gray-300"/>
            <div className="flex justify-between text-sm text-gray-600">
                <span>Unterschrift (Arbeitnehmer)</span>
                <span>Unterschrift (Auftraggeber)</span>
            </div>
        </div>
      </CardFooter>
    </div>
  );
}
