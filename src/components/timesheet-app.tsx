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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SheetTitle } from '@/components/ui/sheet';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


type View = 'new-entry' | 'overview';

function AppContent() {
  const { isMobile } = useSidebar();
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
  const userEntries = allEntries.filter((e) => e.userId === selectedUserId);

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
    setActiveView('overview'); // Switch to overview after adding entry
  };

  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea || !currentDate) {
      console.error("Print area not found or date not set");
      return;
    }
    
    setIsDownloading(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const pages = printArea.querySelectorAll<HTMLElement>('.a4-page-container');
    
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        page.style.transform = 'scale(1)';
        page.style.backgroundColor = 'white';

        const canvas = await html2canvas(page, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: page.offsetWidth,
            height: page.offsetHeight,
        });

        page.style.transform = '';
        page.style.backgroundColor = '';
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
            pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight > pdfHeight ? pdfHeight : imgHeight);
    }
    
    const month = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    pdf.save(`Stundenzettel-${selectedUser?.name?.replace(' ','_')}-${month}.pdf`);

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
    <>
     <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
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
                          <Button variant="outline" size="icon" onClick={handleDownloadPdf} disabled={isDownloading}>
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
    </>
  )
}


export function TimesheetApp() {
  return <AppContent />
}
