"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './auth-provider';
import type { TimeEntry, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EditTimeEntryDialog } from './edit-time-entry-dialog';
import { TimeEntryForm } from './time-entry-form';
import { MonthlyOverview } from './monthly-overview';
import { WorkHoursAnalysis } from './work-hours-analysis';
import { ProfileManagement } from './profile-management';
import {
  Archive,
  BarChart,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { addMonths, subMonths, format } from 'date-fns';
import { de } from 'date-fns/locale';

type View = 'new-entry' | 'monthly-overview' | 'analysis' | 'profile';

export function TimesheetApp() {
  const { user, signOut } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('new-entry');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [enrichedUser, setEnrichedUser] = useState<User | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
  
    setLoading(true);
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
  
    if (error) {
      console.error('Error fetching time entries:', error);
    } else {
      setEntries(data.map(e => ({...e, userId: e.user_id})));
    }
    setLoading(false);
  }, [user]);

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('target_hours')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      const { user_id, ...targetHours } = data;
      setEnrichedUser({
        id: user.id,
        name: user.user_metadata.full_name,
        targetHours
      });
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching target hours:', error);
    } else {
      setEnrichedUser({
        id: user.id,
        name: user.user_metadata.full_name,
        targetHours: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0 }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEntries();
      fetchUserData();
    }
  }, [user, currentDate, fetchEntries, fetchUserData]);

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleEntrySelect = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleEntryUpdate = async (updatedEntry: TimeEntry) => {
    if (!updatedEntry.id) return;
    const { id, userId, ...updateData } = updatedEntry;
    const { error } = await supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', id);
    if (error) {
      console.error('Error updating time entry:', error);
    } else {
      fetchEntries();
      handleDialogClose();
    }
  };
  
  const handleEntryDelete = async (entryId: string) => {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId);
    if (error) {
      console.error('Error deleting time entry:', error);
    } else {
      fetchEntries();
      handleDialogClose();
    }
  };

  const currentMonth = format(currentDate, 'MMMM yyyy', { locale: de });

  const renderView = () => {
    switch (view) {
      case 'new-entry':
        return <TimeEntryForm onEntryCreated={fetchEntries} />;
      case 'monthly-overview':
        return <MonthlyOverview entries={entries} onEntrySelect={handleEntrySelect} onEntryDelete={handleEntryDelete} currentDate={currentDate} />;
      case 'analysis':
        return enrichedUser && <WorkHoursAnalysis entries={entries} user={enrichedUser} currentDate={currentDate} />;
      case 'profile':
        return <ProfileManagement />;
      default:
        return <TimeEntryForm onEntryCreated={fetchEntries} />;
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card p-4 border-r flex flex-col print-hidden transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h1 className="text-2xl font-headline font-bold mb-8">Stundenzettel</h1>
        <nav className="flex flex-col space-y-2">
          <Button variant={view === 'new-entry' ? 'secondary' : 'ghost'} onClick={() => { setView('new-entry'); setIsSidebarOpen(false); }} className="justify-start"><FilePlus className="mr-2 h-4 w-4" />Neuer Eintrag</Button>
          <Button variant={view === 'monthly-overview' ? 'secondary' : 'ghost'} onClick={() => { setView('monthly-overview'); setIsSidebarOpen(false); }} className="justify-start"><Archive className="mr-2 h-4 w-4" />Monatsübersicht</Button>
          <Button variant={view === 'analysis' ? 'secondary' : 'ghost'} onClick={() => { setView('analysis'); setIsSidebarOpen(false); }} className="justify-start"><BarChart className="mr-2 h-4 w-4" />Analyse</Button>
          <Button variant={view === 'profile' ? 'secondary' : 'ghost'} onClick={() => { setView('profile'); setIsSidebarOpen(false); }} className="justify-start"><UserIcon className="mr-2 h-4 w-4" />Profil</Button>
        </nav>
        <div className="mt-auto">
          <Button variant="ghost" onClick={signOut} className="w-full justify-start"><LogOut className="mr-2 h-4 w-4" />Abmelden</Button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="flex items-center justify-between mb-8 print-hidden">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="md:hidden mr-4" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
            <h2 className="text-2xl font-bold">{user?.user_metadata.full_name}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => handleDateChange(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold w-40 text-center">{currentMonth}</span>
            <Button variant="outline" size="icon" onClick={() => handleDateChange(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {loading ? <p>Wird geladen...</p> : renderView()}
      </main>
      {selectedEntry && (
        <EditTimeEntryDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          entry={selectedEntry}
          onUpdate={handleEntryUpdate}
          onDelete={handleEntryDelete}
        />
      )}
    </div>
  );
}
