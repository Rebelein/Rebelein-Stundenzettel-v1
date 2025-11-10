"use client";

import { TimesheetApp } from '@/components/timesheet-app';
import { AuthForm } from '@/components/auth';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <main>
      <TimesheetApp />
    </main>
  );
}
