"use client";

import { useState, useEffect } from 'react';
import type { TimeEntry } from '@/lib/types';
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
  User as UserIcon,
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
import { WorkHoursAnalysis } from './work-hours-analysis';
import { ProfileManagement } from './profile-management';


type View = 'new-entry' | 'overview' | 'analysis' | 'profile';

export function TimesheetApp() {
  const { user: authUser } = useAuth();
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());
  const [downloadStartDate, setDownloadStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [downloadEndDate, setDownloadEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [activeView, setActiveView] = useState<View>('new-entry');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    const fetchInitialData = async () => {
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

    const monthlyEntries = allEntries.filter(entry => {
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

    // Correctly format the date to a local YYYY-MM-DD string
    const localDate = new Date(newEntry.date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const { error } = await supabase.from('time_entries').insert({
      ...newEntry,
      date: formattedDate,
      user_id: authUser.id,
    });
    if (error) {
      console.error("Error adding entry:", error);
    } else {
      setCurrentDate(newEntry.date);
    }
  };
  
  const updateEntry = async (updatedEntry: TimeEntry) => {
    // Correctly format the date to a local YYYY-MM-DD string
    const localDate = new Date(updatedEntry.date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const { error } = await supabase
      .from('time_entries')
      .update({
        date: formattedDate,
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
    if (!authUser || !currentDate) return;

    const selectedDateStr = currentDate.toISOString().split('T')[0];
    const entriesForDay = allEntries.filter(e => e.date === selectedDateStr);

    if (entriesForDay.length === 0) {
        alert("Für den ausgewählten Tag gibt es keine Einträge zum Herunterladen.");
        return;
    }
    
    setIsDownloading(true);

    const doc = new jsPDF('p', 'mm', 'a4'); // p for portrait
    const userName = authUser.user_metadata.full_name || authUser.email;
    const formattedDate = new Date(currentDate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Monteur: ${userName}`, margin, margin);
    doc.text(formattedDate, pageWidth - margin, margin, { align: 'right' });

    const tableBody: (string | number)[][] = [];
    const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7); // 7 to 19

    let entryIndex = 0;
    for (let i = 0; i < timeSlots.length; i++) {
        const hour = timeSlots[i];

        // Place entries in every other row, starting with the first one (7 Uhr)
        if (i % 2 === 0 && entryIndex < entriesForDay.length) {
            const entry = entriesForDay[entryIndex];
            tableBody.push([
                hour.toString(),
                entry.customer,
                entry.hours.toFixed(2).replace('.', ',')
            ]);
            entryIndex++;
        } else {
            tableBody.push([hour.toString(), '', '']);
        }
    }

    const totalHours = entriesForDay.reduce((sum, entry) => sum + entry.hours, 0);

    (doc as any).autoTable({
        startY: margin + 10,
        head: [['Uhr', 'Baustelle - Tätigkeit', 'Stunden']],
        body: tableBody,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 10,
            cellPadding: 2,
        },
        headStyles: {
            fontStyle: 'bold',
            fillColor: [255, 255, 255],
            textColor: 0,
            lineWidth: 0.1,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left' },
            2: { halign: 'right', cellWidth: 25 },
        },
        didDrawPage: (data: any) => {
            // Draw Gesamtstunden below the table
            const tableEndY = data.cursor.y;
            const textY = tableEndY + 8;

            doc.setFont('helvetica', 'bold');
            doc.text('Gesamtstunden', margin, textY);

            const totalHoursText = totalHours.toFixed(2).replace('.', ',');
            const hoursColumnX = pageWidth - margin - 25; // Align with the right edge of the 'Stunden' column
            doc.text(totalHoursText, hoursColumnX + 25, textY, { align: 'right' });
        }
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.text(
        'Stefan Rebelein Sanitär GmbH, Martin-Behaim-Str. 6, 90765 Fürth',
        pageWidth / 2,
        pageHeight - margin + 10,
        { align: 'center' }
    );
    
    doc.save(`Stundenzettel_${userName?.replace(/[@.\s]/g, '_')}_${selectedDateStr}.pdf`);
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
    analysis: 'Soll-Ist-Analyse',
    profile: 'Profil',
  };

  if (currentDate === undefined || !authUser) {
    return <div className="flex items-center justify-center h-screen">Wird geladen...</div>;
  }
  
  const user = { id: authUser.id, name: authUser.user_metadata.full_name || authUser.email || '' };

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
               <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveView('profile')}
                  isActive={activeView === 'profile'}
                  tooltip="Profil"
                >
                  <UserIcon />
                  Profil
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
                 <p className="text-muted-foreground">{user.name}</p>
              </header>

              {activeView === 'profile' && <ProfileManagement />}
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
                     <div className="flex items-center justify-center gap-4 rounded-lg border p-4">
                       <Label>Tages-PDF herunterladen:</Label>
                       <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={handleDownloadPdf} disabled={isDownloading}>
                                {isDownloading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                <span className="sr-only">Tages-PDF Herunterladen</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>PDF für den {currentDate.toLocaleDateString('de-DE')} erstellen</p>
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
                    entries={monthlyEntries}
                    user={user}
                    currentDate={currentDate}
                />
            )}

            {activeView === 'overview' && (
              <div className="mt-8 print:mt-0">
                 <MonthlyOverview
                  entries={monthlyEntries}
                  user={user}
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
