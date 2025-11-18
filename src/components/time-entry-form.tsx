"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PlusCircle } from 'lucide-react';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './auth-provider';

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

type TimeEntryFormProps = {
  onEntryCreated: () => void;
};

export function TimeEntryForm({ onEntryCreated }: TimeEntryFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      customer: '',
      hours: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    const { error } = await supabase.from('time_entries').insert({
      ...values,
      user_id: user.id,
      date: new Date(values.date.getTime() - (values.date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10),
    });

    if (error) {
      toast({
        title: 'Fehler',
        description: `Fehler beim Speichern des Eintrags: ${error.message}`,
        variant: 'destructive',
      });
    } else {
      onEntryCreated();
      form.reset({ ...form.getValues(), customer: '', hours: 0 });
      toast({
        title: 'Eintrag hinzugefügt',
        description: `Eintrag für ${values.customer} wurde gespeichert.`,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg">Neuer Eintrag</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
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
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Eintrag hinzufügen
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
