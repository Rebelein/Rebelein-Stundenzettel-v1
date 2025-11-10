"use client";

import { useState, useEffect } from 'react';
import type { User, TimeEntry } from '@/lib/types';
import { users, initialEntries } from '@/lib/data';
import { TimeEntryForm } from './time-entry-form';
import { MonthlyOverview } from './monthly-overview';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileClock,
  LayoutGrid,
  Plus,
  Loader2
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
import { SheetTitle } from '@/components/ui/sheet';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


type View = 'new-entry' | 'overview';

export function TimesheetApp() {
  const [allEntries, setAllEntries] = useState<TimeEntry[]>(initialEntries);
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);
  const [activeView, setActiveView] = useState<View>('new-entry');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Set initial date only on the client to avoid hydration mismatch
    setCurrentDate(new Date());
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const userEntries = allEntries.filter((e) => e.userId === selectedUserId).filter(entry => {
      if (!currentDate) return false;
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === currentDate.getFullYear() && entryDate.getMonth() === currentDate.getMonth();
  });


  const addEntry = (newEntry: {
    date: Date;
    customer: string;
    hours: number;
  }) => {
    if (!selectedUserId) return;
    const entry: TimeEntry = {
      ...newEntry,
      id: `e${Date.now()}`,
      date: newEntry.date.toISOString().split('T')[0],
      userId: selectedUserId,
    };
    setAllEntries((prev) => [...prev, entry]);
    setCurrentDate(newEntry.date);
    setActiveView('overview'); // Switch to overview after adding entry
  };

  const handleDownloadPdf = async () => {
    if (!selectedUser || !currentDate || userEntries.length === 0) return;
    setIsDownloading(true);

    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Group entries by date
    const entriesByDate = userEntries.reduce((acc, entry) => {
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
        const a5Height = 210;
        const margin = 15;
        const contentWidth = a5Width - (margin * 2);

        // A5 Box
        doc.rect(xOffset, 0, a5Width, a5Height); 
        
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
            styles: {
                font: 'helvetica',
                fontSize: 10,
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
            didDrawPage: (data: any) => {
                // We handle drawing manually, so nothing needed here
            }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY;

        // Footer Signatures
        const signatureY = a5Height - margin - 5;
        doc.line(xOffset + margin, signatureY, xOffset + margin + 50, signatureY);
        doc.text('Unterschrift', xOffset + margin, signatureY + 5);

        doc.line(xOffset + a5Width - margin - 50, signatureY, xOffset + a5Width - margin, signatureY);
        doc.text('Unterschrift', xOffset + a5Width - margin - 50, signatureY + 5);
    };

    for (let i = 0; i < sortedDays.length; i += 2) {
      if (i > 0) {
        doc.addPage();
      }
      // Draw left A5 page
      drawTimesheet(sortedDays[i], 0);

      // Draw right A5 page if it exists
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
      return newDate;
    });
  };

  const formattedMonth = currentDate?.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) || '';

  if (currentDate === undefined) {
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
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
           <div className="container mx-auto p-4 md:p-8">
            <div className="no-print flex flex-col gap-8">
              <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-2">
                  <SidebarTrigger className="md:hidden" />
                  <h1 className="text-2xl md:text-3xl font-headline font-bold">
                    {activeView === 'new-entry' ? 'Neuer Eintrag' : 'Monatsübersicht'}
                  </h1>
                </div>
                <div className="flex w-full md:w-auto items-center gap-4">
                   <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Benutzer auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeView === 'overview' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={handleDownloadPdf} disabled={isDownloading || userEntries.length === 0}>
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="sr-only">PDF Herunterladen</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Als PDF herunterladen</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </header>

              {activeView === 'new-entry' && <TimeEntryForm addEntry={addEntry} />}
              
              {activeView === 'overview' && (
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium font-headline w-40 text-center">{formattedMonth}</span>
                  <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
                      <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {activeView === 'overview' && (
              <div className="mt-8 print:mt-0">
                 <MonthlyOverview
                  entries={userEntries}
                  user={selectedUser}
                  currentDate={currentDate}
                />
              </div>
            )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
