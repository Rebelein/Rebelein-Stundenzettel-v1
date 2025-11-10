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
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EditTimeEntryDialog } from './edit-time-entry-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TimesheetDayProps {
  date: Date;
  user: User | undefined;
  entries: TimeEntry[];
  updateEntry: (entry: TimeEntry) => void;
  deleteEntry: (entryId: string) => void;
}

export function TimesheetDay({ date, user, entries, updateEntry, deleteEntry }: TimesheetDayProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  const formattedDate = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
    <div className="bg-white text-black w-full h-full p-6 flex flex-col">
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
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.customer}</TableCell>
                  <TableCell className="text-right">{entry.hours.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingEntry(entry)}>
                        <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eintrag wirklich löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Diese Aktion kann nicht rückgängig gemacht werden. Der Zeiteintrag wird dauerhaft gelöscht.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEntry(entry.id)}>Löschen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-10">
                  Keine Einträge für diesen Tag.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
             <TableRow>
                <TableCell className="font-bold">Gesamt</TableCell>
                <TableCell className="text-right font-bold" colSpan={2}>{totalHours.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>

      <CardFooter className="p-0 mt-auto pt-8">
        <div className="w-full">
            <Separator className="my-4 bg-gray-300"/>
            <div className="flex justify-between text-sm text-gray-600">
                <span>Unterschrift</span>
                <span>Unterschrift</span>
            </div>
        </div>
      </CardFooter>
    </div>
    {editingEntry && (
        <EditTimeEntryDialog 
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
            onSave={(updatedEntry) => {
                updateEntry(updatedEntry);
                setEditingEntry(null);
            }}
        />
    )}
    </>
  );
}
