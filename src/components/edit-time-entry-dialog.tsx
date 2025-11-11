"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import type { TimeEntry } from '@/lib/types';

const formSchema = z.object({
  date: z.date({
    required_error: 'Ein Datum wird benötigt.',
  }),
  customer: z.string().min(2, {
    message: 'Der Kundenname muss mindestens 2 Zeichen lang sein.',
  }),
  hours: z.coerce
    .number({ invalid_type_error: 'Bitte geben Sie eine Zahl ein' })
    .min(0.1, { message: 'Die Stunden müssen positiv sein.' }),
});

interface EditTimeEntryDialogProps {
  isOpen: boolean;
  entry: TimeEntry;
  onClose: () => void;
  onUpdate: (entry: TimeEntry) => void;
  onDelete: (entryId: string) => void;
}

export function EditTimeEntryDialog({ isOpen, entry, onClose, onUpdate, onDelete }: EditTimeEntryDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(entry.date),
      customer: entry.customer,
      hours: entry.hours,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onUpdate({
      ...entry,
      ...values,
      date: values.date.toISOString().split('T')[0],
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eintrag bearbeiten</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datum</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kundenname</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Kunde A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stunden (dezimal)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="z.B. 7.5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => onDelete(entry.id)}>
                Löschen
              </Button>
              <div className="flex-grow" />
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Abbrechen
                </Button>
              </DialogClose>
              <Button type="submit">Speichern</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
