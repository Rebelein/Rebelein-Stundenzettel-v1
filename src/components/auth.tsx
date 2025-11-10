"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthForm() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Stundenzettel Meister</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-Mail-Adresse',
                  password_label: 'Passwort',
                  button_label: 'Anmelden',
                  link_text: 'Bereits registriert? Anmelden',
                },
                sign_up: {
                  email_label: 'E-Mail-Adresse',
                  password_label: 'Passwort',
                  button_label: 'Registrieren',
                  link_text: 'Noch kein Konto? Registrieren',
                },
                forgotten_password: {
                  email_label: 'E-Mail-Adresse',
                  button_label: 'Passwort zurücksetzen',
                  link_text: 'Passwort vergessen?',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
