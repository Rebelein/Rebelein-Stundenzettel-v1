"use client";

import { useState, useEffect } from 'react';
import type { User, TimeEntry } from '@/lib/types';
import { users as mockUsers, initialEntries } from '@/lib/data';
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
  Loader2,
  Users
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


type View = 'new-entry' | 'overview' | 'users';

export function TimesheetApp() {
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);
  const [downloadStartDate, setDownloadStartDate] = useState<Date | undefined>(undefined);
  const [downloadEndDate, setDownloadEndDate] = useState<Date | undefined>(undefined);
  const [activeView, setActiveView] = useState<View>('new-entry');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Load data from localStorage on the client
    const storedUsers = localStorage.getItem('timesheet_users');
    const storedEntries = localStorage.getItem('timesheet_entries');

    const loadedUsers = storedUsers ? JSON.parse(storedUsers) : mockUsers;
    const loadedEntries = storedEntries ? JSON.parse(storedEntries) : initialEntries;

    setUsers(loadedUsers);
    setAllEntries(loadedEntries);

    if (loadedUsers.length > 0) {
      setSelectedUserId(loadedUsers[0].id);
    }
    
    const now = new Date();
    setCurrentDate(now);
    setDownloadStartDate(startOfMonth(now));
    setDownloadEndDate(endOfMonth(now));
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    localStorage.setItem('timesheet_users', JSON.stringify(users));
    localStorage.setItem('timesheet_entries', JSON.stringify(allEntries));
  }, [users, allEntries]);

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
  };
  
  const updateEntry = (updatedEntry: TimeEntry) => {
    setAllEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };
  
  const deleteEntry = (entryId: string) => {
     setAllEntries(prev => prev.filter(e => e.id !== entryId));
  }

  const handleDownloadPdf = async () => {
    if (!selectedUser || !currentDate || !downloadStartDate || !downloadEndDate) return;

    const entriesToDownload = allEntries.filter(entry => {
        if (entry.userId !== selectedUserId) return false;
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

  const addUser = (name: string) => {
    const newUser: User = { id: `u${Date.now()}`, name };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (selectedUserId === updatedUser.id) {
       // Just to trigger a re-render if the name of the selected user changes
       setSelectedUserId(updatedUser.id);
    }
  };

  const deleteUser = (userId: string) => {
    // Also delete all entries for this user
    setAllEntries(prev => prev.filter(e => e.userId !== userId));
    setUsers(prev => {
      const newUsers = prev.filter(u => u.id !== userId);
      // If the deleted user was the selected one, select the first user if available
      if (selectedUserId === userId) {
        setSelectedUserId(newUsers[0]?.id);
      }
      return newUsers;
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
               <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveView('users')}
                  isActive={activeView === 'users'}
                  tooltip="Benutzer verwalten"
                >
                  <Users />
                  Benutzer
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
                    {activeView === 'new-entry' ? 'Neuer Eintrag' : 
                     activeView === 'overview' ? 'Monatsübersicht' : 'Benutzerverwaltung'}
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
                </div>
              </header>

              {activeView === 'new-entry' && <TimeEntryForm addEntry={addEntry} />}
              
              {activeView === 'users' && (
                <UserManagement 
                  users={users}
                  addUser={addUser}
                  updateUser={updateUser}
                  deleteUser={deleteUser}
                />
              )}
              
              {activeView === 'overview' && (
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
                </div>
              )}
            </div>

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
