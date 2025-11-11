"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"

export function AuthForm() {
  const { toast } = useToast();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetHours, setTargetHours] = useState({
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
  });
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSigningUp) {
      // Sign Up
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({ title: "Fehler bei der Registrierung", description: error.message, variant: "destructive" });
      } else if (user) {
        const { error: targetHoursError } = await supabase
          .from('target_hours')
          .insert({ user_id: user.id, ...targetHours });

        if (targetHoursError) {
          // TODO: Here we should ideally delete the user that was just created.
          // For this PoC we will just show an error.
          toast({ title: "Fehler bei der Registrierung", description: `Ihr Benutzer wurde erstellt, aber es gab einen Fehler beim Speichern Ihrer Soll-Stunden. ${targetHoursError.message}`, variant: "destructive" });
        } else {
          toast({ title: "Registrierung erfolgreich", description: "Bitte prüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen." });
          setIsSigningUp(false); // Switch back to login view
        }
      }
    } else {
      // Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast({ title: "Anmeldung fehlgeschlagen", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">
            {isSigningUp ? 'Konto erstellen' : 'Stundenzettel Meister'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthAction}>
            <div className="grid gap-4">
              {isSigningUp && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="full-name">Vollständiger Name</Label>
                    <Input
                      id="full-name"
                      placeholder="Max Mustermann"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Soll-Stunden pro Tag</Label>
                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <Label htmlFor="monday" className="sr-only">Montag</Label>
                        <Input id="monday" type="number" placeholder="Mo" value={targetHours.monday} onChange={(e) => setTargetHours({ ...targetHours, monday: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label htmlFor="tuesday" className="sr-only">Dienstag</Label>
                        <Input id="tuesday" type="number" placeholder="Di" value={targetHours.tuesday} onChange={(e) => setTargetHours({ ...targetHours, tuesday: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label htmlFor="wednesday" className="sr-only">Mittwoch</Label>
                        <Input id="wednesday" type="number" placeholder="Mi" value={targetHours.wednesday} onChange={(e) => setTargetHours({ ...targetHours, wednesday: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label htmlFor="thursday" className="sr-only">Donnerstag</Label>
                        <Input id="thursday" type="number" placeholder="Do" value={targetHours.thursday} onChange={(e) => setTargetHours({ ...targetHours, thursday: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label htmlFor="friday" className="sr-only">Freitag</Label>
                        <Input id="friday" type="number" placeholder="Fr" value={targetHours.friday} onChange={(e) => setTargetHours({ ...targetHours, friday: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@beispiel.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Wird geladen...' : (isSigningUp ? 'Registrieren' : 'Anmelden')}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSigningUp ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
            <Button
              variant="link"
              onClick={() => setIsSigningUp(!isSigningUp)}
              className="ml-1"
            >
              {isSigningUp ? 'Anmelden' : 'Registrieren'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
