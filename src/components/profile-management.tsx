"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"

export function ProfileManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [targetHours, setTargetHours] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
  });

  useEffect(() => {
    if (user) {
      if (user.user_metadata.full_name) {
        setFullName(user.user_metadata.full_name);
      }

      const fetchTargetHours = async () => {
        const { data, error } = await supabase
          .from('target_hours')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          const { user_id, ...hours } = data;
          setTargetHours(hours);
        } else if (error && error.code !== 'PGRST116') { // Ignore 'single row not found' error
          toast({ title: "Fehler", description: `Fehler beim Laden der Soll-Stunden: ${error.message}`, variant: "destructive" });
        }
      };

      fetchTargetHours();
    }
  }, [user, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error: userError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    const { error: targetHoursError } = await supabase
      .from('target_hours')
      .upsert({ user_id: user.id, ...targetHours });

    if (userError || targetHoursError) {
      toast({ title: "Fehler", description: userError?.message || targetHoursError?.message, variant: "destructive" });
    } else {
      toast({ title: "Erfolg", description: "Ihr Profil wurde erfolgreich aktualisiert." });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Aktualisieren Sie hier Ihren Anzeigenamen und Ihre Soll-Stunden.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input id="email" type="email" value={user?.email || ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full-name">Vollständiger Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
