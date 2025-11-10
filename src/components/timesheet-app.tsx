"use client";

import { useState, useEffect } from 'react';
import type { User, TimeEntry } from '@/lib/types';
import { useAuth } from './auth-provider';
import { supabase } from '@/lib/supabaseClient';
import { TimeEntryForm } from './time-entry-form';
import { MonthlyOverview } from './monthly-overview';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileClock,
  LayoutGrid,
  Plus,
  Loader2,
  BarChart,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserManagement } from './user-management';
import { WorkHoursAnalysis } from './work-hours-analysis';


type View = 'new-entry' | 'overview' | 'users' | 'analysis';

export function TimesheetApp() {
  const { user: authUser } = useAuth();
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());
  const [downloadStartDate, setDownloadStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [downloadEndDate, setDownloadEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [activeView, setActiveView] = useState<View>('new-entry');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    const fetchInitialData = async () => {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) console.error('Error fetching user:', userError);
      else setSelectedUser(userData);

      // Fetch time entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', authUser.id);

      if (entriesError) console.error('Error fetching entries:', entriesError);
      else setAllEntries(entriesData || []);
    };

    fetchInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel('time_entries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAllEntries((prev) => [...prev, payload.new as TimeEntry]);
          }
          if (payload.eventType === 'UPDATE') {
            setAllEntries((prev) =>
              prev.map((e) => (e.id === payload.new.id ? (payload.new as TimeEntry) : e))
            );
          }
          if (payload.eventType === 'DELETE') {
            setAllEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser]);

  const userEntries = allEntries.filter((e) => e.userId === selectedUser?.id).filter(entry => {
      if (!currentDate) return false;
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === currentDate.getFullYear() && entryDate.getMonth() === currentDate.getMonth();
  });


  const addEntry = async (newEntry: {
    date: Date;
    customer: string;
    hours: number;
  }) => {
    if (!authUser) return;
    const { error } = await supabase.from('time_entries').insert({
      ...newEntry,
      date: newEntry.date.toISOString().split('T')[0],
      user_id: authUser.id,
    });
    if (error) {
      console.error("Error adding entry:", error);
    } else {
      setCurrentDate(newEntry.date);
    }
  };
  
  const updateEntry = async (updatedEntry: TimeEntry) => {
    const { error } = await supabase
      .from('time_entries')
      .update({
        date: updatedEntry.date,
        customer: updatedEntry.customer,
        hours: updatedEntry.hours,
      })
      .eq('id', updatedEntry.id);
    if (error) console.error('Error updating entry:', error);
  };
  
  const deleteEntry = async (entryId: string) => {
     const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
     if (error) console.error("Error deleting entry:", error);
  }

  const handleDownloadPdf = async () => {
    if (!selectedUser || !currentDate || !downloadStartDate || !downloadEndDate) return;

    const entriesToDownload = allEntries.filter(entry => {
        if (entry.userId !== selectedUser?.id) return false;
        const entryDate = new Date(entry.date);
        const inclusiveEndDate = new Date(downloadEndDate);
        inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
        return entryDate >= downloadStartDate && entryDate < inclusiveEndDate;
    });

    if (entriesToDownload.length === 0) {
        alert("Keine Einträge im ausgewählten Zeitraum gefunden.");
        return;
    }
    
    setIsDownloading(true);

    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    const entriesByDate = entriesToDownload.reduce((acc, entry) => {
        (acc[entry.date] = acc[entry.date] || []).push(entry);
        return acc;
    }, {} as Record<string, TimeEntry[]>);

    const sortedDays = Object.keys(entriesByDate).sort();

    const drawTimesheet = (dayDate: string, xOffset: number) => {
        const entries = entriesByDate[dayDate];
        const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        const formattedDate = new Date(dayDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        
        const a5Width = 148;
        const margin = 15;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Stundenzettel', xOffset + margin, margin);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(selectedUser.name, xOffset + margin, margin + 7);
        doc.text(formattedDate, xOffset + a5Width - margin, margin + 7, { align: 'right' });
        
        // Table
        (doc as any).autoTable({
            startY: margin + 15,
            head: [['Kunde / Tätigkeit', 'Stunden']],
            body: entries.map(e => [e.customer, e.hours.toFixed(2)]),
            foot: [['Gesamt', totalHours.toFixed(2)]],
            margin: { left: xOffset + margin, right: 297 - (xOffset + a5Width - margin)},
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 2,
            },
            headStyles: {
                fontStyle: 'bold',
                fillColor: [230, 230, 230],
                textColor: 20
            },
            footStyles: {
                fontStyle: 'bold',
                fillColor: [230, 230, 230],
                textColor: 20
            },
            columnStyles: {
                1: { halign: 'right' },
            },
        });
        
        const finalY = (doc as any).lastAutoTable.finalY;

        // Footer Signatures
        const signatureY = 210 - margin - 15;
        doc.line(xOffset + margin, signatureY, xOffset + margin + 50, signatureY);
        doc.text('Unterschrift', xOffset + margin, signatureY + 5);

        doc.line(xOffset + a5Width - margin - 50, signatureY, xOffset + a5Width - margin, signatureY);
        doc.text('Unterschrift', xOffset + a5Width - margin - 50, signatureY + 5);
    };

    for (let i = 0; i < sortedDays.length; i += 2) {
      if (i > 0) {
        doc.addPage();
      }
      drawTimesheet(sortedDays[i], 0);

      if (sortedDays[i + 1]) {
        drawTimesheet(sortedDays[i + 1], 148.5);
      }
    }
    
    const month = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    doc.save(`Stundenzettel-${selectedUser?.name?.replace(' ','_')}-${month}.pdf`);

    setIsDownloading(false);
  };
  
  const changeMonth = (amount: number) => {
    setCurrentDate(prevDate => {
      if (!prevDate) return new Date();
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      setDownloadStartDate(startOfMonth(newDate));
      setDownloadEndDate(endOfMonth(newDate));
      return newDate;
    });
  };

  const formattedMonth = currentDate?.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) || '';
  
  const viewTitles: Record<View, string> = {
    'new-entry': 'Neuer Eintrag',
    overview: 'Monatsübersicht',
    users: 'Benutzerverwaltung',
    analysis: 'Soll-Ist-Analyse',
  };

  if (currentDate === undefined || !selectedUser) {
    return <div className="flex items-center justify-center h-screen">Wird geladen...</div>;
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                 <FileClock className="size-5 text-primary" />
               </Button>
              <span className="text-lg font-bold font-headline">Stundenzettel</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('new-entry')}
                  isActive={activeView === 'new-entry'}
                  tooltip="Neuer Eintrag"
                >
                  <Plus />
                  Neuer Eintrag
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('overview')}
                  isActive={activeView === 'overview'}
                  tooltip="Monatsübersicht"
                >
                  <LayoutGrid />
                  Monatsübersicht
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('analysis')}
                  isActive={activeView === 'analysis'}
                  tooltip="Soll-Ist-Analyse"
                >
                  <BarChart />
                  Analyse
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => supabase.auth.signOut()} tooltip="Abmelden">
                  <LogOut />
                  Abmelden
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
        </Sidebar>
        <SidebarInset>
           <div className="container mx-auto p-4 md:p-8">
            <div className="no-print flex flex-col gap-8">
              <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <h1 className="text-2xl md:text-3xl font-headline font-bold">
                    {viewTitles[activeView]}
                  </h1>
                 </div>
                 <p className="text-muted-foreground">{selectedUser?.name}</p>
              </header>

              {activeView === 'new-entry' && <TimeEntryForm addEntry={addEntry} />}
              
              {(activeView === 'overview' || activeView === 'analysis') && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-medium font-headline w-40 text-center">{formattedMonth}</span>
                    <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                   {activeView === 'overview' && (
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-4 rounded-lg border p-4">
                       <div className="grid gap-2">
                        <Label htmlFor="download-start">Download Start</Label>
                        <DatePicker date={downloadStartDate} setDate={setDownloadStartDate} />
                      </div>
                       <div className="grid gap-2">
                        <Label htmlFor="download-end">Download Ende</Label>
                        <DatePicker date={downloadEndDate} setDate={setDownloadEndDate} />
                      </div>
                      <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="self-end">
                              <Button variant="outline" size="icon" onClick={handleDownloadPdf} disabled={isDownloading}>
                                {isDownloading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                <span className="sr-only">PDF Herunterladen</span>
                              </Button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Als PDF herunterladen</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </div>
                   )}
                </div>
              )}
            </div>
            
            {activeView === 'analysis' && (
                <WorkHoursAnalysis 
                    entries={userEntries}
                    user={selectedUser}
                    currentDate={currentDate}
                />
            )}

            {activeView === 'overview' && (
              <div className="mt-8 print:mt-0">
                 <MonthlyOverview
                  entries={userEntries}
                  user={selectedUser}
                  currentDate={currentDate}
                  updateEntry={updateEntry}
                  deleteEntry={deleteEntry}
                />
              </div>
            )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
