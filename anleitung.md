# Anleitung: Migration von Local Storage zu Supabase Realtime DB

Diese Anleitung beschreibt die notwendigen Schritte, um die "Stundenzettel Meister"-Anwendung von der lokalen Speicherung im Browser (`localStorage`) auf eine persistente und echtzeitfähige Supabase-Datenbank umzustellen.

## Vorteile von Supabase

*   **Echtzeit-Synchronisation:** Änderungen werden sofort auf allen Geräten und für alle Benutzer sichtbar.
*   **Persistente Datenspeicherung:** Die Daten sind sicher in der Cloud gespeichert und gehen nicht verloren.
*   **Multi-User-Fähigkeit:** Mehrere Benutzer können gleichzeitig und mit ihren eigenen Daten arbeiten.
*   **Skalierbarkeit:** Die Lösung wächst mit Ihren Anforderungen.

---

## Schritt 1: Supabase-Projekt einrichten

1.  **Account erstellen:** Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie einen kostenlosen Account.
2.  **Neues Projekt:** Erstellen Sie ein neues Projekt. Wählen Sie einen Namen (z. B. `stundenzettel-app`) und eine Region in Ihrer Nähe (z. B. `eu-central-1`).
3.  **Projekt-Schlüssel notieren:** Navigieren Sie nach der Projekterstellung zu **Project Settings** (Zahnrad-Icon) > **API**. Kopieren und speichern Sie die folgenden beiden Werte. Sie werden im nächsten Schritt im Code benötigt:
    *   **Project URL**
    *   **`anon` `public` Key**

---

## Schritt 2: Datenbank-Tabellen erstellen

Navigieren Sie im Supabase-Dashboard zum **Table Editor** (Tabellen-Icon). Hier erstellen wir die notwendigen Tabellen, um die Datenstruktur der Anwendung abzubilden.

### a) Tabelle für Benutzer (`users`)

1.  Klicken Sie auf **"Create a new table"**.
2.  Geben Sie als Tabellenname `users` ein.
3.  Deaktivieren Sie **"Enable Row Level Security (RLS)"** vorübergehend. Wir aktivieren es später wieder.
4.  Definieren Sie die folgenden Spalten:
    *   `id`: `uuid` (wird automatisch als Primary Key gesetzt)
    *   `name`: `text`
5.  Klicken Sie auf **"Save"**.

### b) Tabelle für Zeiteinträge (`time_entries`)

1.  Klicken Sie erneut auf **"Create a new table"**.
2.  Geben Sie als Tabellenname `time_entries` ein.
3.  Deaktivieren Sie **"Enable Row Level Security (RLS)"** ebenfalls vorübergehend.
4.  Definieren Sie die folgenden Spalten:
    *   `id`: `uuid` (wird automatisch als Primary Key gesetzt)
    *   `date`: `date`
    *   `customer`: `text`
    *   `hours`: `float8`
    *   `user_id`: `uuid`
5.  **Beziehung (Foreign Key) erstellen:**
    *   Klicken Sie bei der `user_id`-Spalte auf das Beziehungs-Icon (Kettenglied).
    *   Wählen Sie die `users`-Tabelle und die `id`-Spalte aus.
    *   Klicken Sie auf **"Save"**.
6.  Klicken Sie auf **"Save"**, um die Tabelle zu erstellen.

---

## Schritt 3: Supabase in die Anwendung integrieren

### a) Supabase-Client installieren

Öffnen Sie ein Terminal im Projektverzeichnis und führen Sie folgenden Befehl aus:

```bash
npm install @supabase/supabase-js
```

### b) Supabase-Client initialisieren

1.  Erstellen Sie eine neue Datei unter `src/lib/supabaseClient.ts`.
2.  Fügen Sie folgenden Code ein und ersetzen Sie die Platzhalter durch Ihre Supabase Projekt-URL und den `anon` Key aus Schritt 1:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'IHRE_SUPABASE_PROJEKT_URL';
const supabaseAnonKey = 'IHR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### c) Datenlogik in `timesheet-app.tsx` anpassen

Öffnen Sie `src/components/timesheet-app.tsx` und ersetzen Sie die `localStorage`-Logik durch Supabase-Aufrufe.

1.  **Importieren Sie den Supabase-Client:**
    ```typescript
    import { supabase } from '@/lib/supabaseClient';
    ```

2.  **Daten laden mit `useEffect`:** Ersetzen Sie die `useState`-Initialisierung und den `useEffect`-Hook für die `localStorage`-Logik durch folgenden Code, um die Daten aus Supabase zu laden:

    ```typescript
    // Bestehende useState-Hooks anpassen
    const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    
    // ...
    
    // Bestehenden useEffect für Hydration entfernen und durch diesen ersetzen:
    useEffect(() => {
      async function fetchData() {
        // Benutzer laden
        const { data: usersData, error: usersError } = await supabase.from('users').select('*');
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          setUsers(usersData || []);
          if (usersData && usersData.length > 0) {
            setSelectedUserId(usersData[0].id);
          }
        }
        
        // Einträge laden
        const { data: entriesData, error: entriesError } = await supabase.from('time_entries').select('*');
        if (entriesError) {
            console.error('Error fetching time entries:', entriesError);
        } else {
            setAllEntries(entriesData || []);
        }
      }
      fetchData();
      
      const now = new Date();
      setCurrentDate(now);
      setDownloadStartDate(startOfMonth(now));
      setDownloadEndDate(endOfMonth(now));
    }, []);
    ```

3.  **`addEntry`-Funktion anpassen:**

    ```typescript
    const addEntry = async (newEntry: {
      date: Date;
      customer: string;
      hours: number;
    }) => {
      if (!selectedUserId) return;
      const entryData = {
        date: newEntry.date.toISOString().split('T')[0],
        customer: newEntry.customer,
        hours: newEntry.hours,
        user_id: selectedUserId,
      };

      const { data, error } = await supabase
        .from('time_entries')
        .insert([entryData])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding entry:', error);
      } else if (data) {
        setAllEntries((prev) => [...prev, data as TimeEntry]);
        setCurrentDate(newEntry.date);
      }
    };
    ```

4.  **`updateEntry`-Funktion anpassen:**

    ```typescript
    const updateEntry = async (updatedEntry: TimeEntry) => {
        const { error } = await supabase
            .from('time_entries')
            .update({ 
                date: updatedEntry.date, 
                customer: updatedEntry.customer, 
                hours: updatedEntry.hours 
            })
            .eq('id', updatedEntry.id);
            
        if (error) {
            console.error('Error updating entry:', error);
        } else {
            setAllEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
        }
    };
    ```

5.  **`deleteEntry`-Funktion anpassen:**

    ```typescript
    const deleteEntry = async (entryId: string) => {
        const { error } = await supabase
            .from('time_entries')
            .delete()
            .eq('id', entryId);
            
        if (error) {
            console.error('Error deleting entry:', error);
        } else {
            setAllEntries(prev => prev.filter(e => e.id !== entryId));
        }
    };
    ```

---

## Schritt 4: Echtzeit-Updates aktivieren

Um die Magie von Supabase voll auszuschöpfen, aktivieren wir Echtzeit-Updates. Wenn ein Benutzer eine Änderung vornimmt, wird sie sofort bei allen anderen angezeigt.

Fügen Sie diesen `useEffect`-Hook in `src/components/timesheet-app.tsx` hinzu:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('time_entries')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'time_entries' },
      (payload) => {
        const newEntry = payload.new as TimeEntry;
        const oldEntry = payload.old as TimeEntry;
        
        if (payload.eventType === 'INSERT') {
          setAllEntries((prev) => [...prev, newEntry]);
        } else if (payload.eventType === 'UPDATE') {
          setAllEntries((prev) => prev.map(e => e.id === newEntry.id ? newEntry : e));
        } else if (payload.eventType === 'DELETE') {
          setAllEntries((prev) => prev.filter(e => e.id !== oldEntry.id));
        }
      }
    )
    .subscribe();

  // Cleanup-Funktion
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Schritt 5: Sicherheit (Row Level Security)

Zum Schluss ist es **essenziell**, die Sicherheit Ihrer Datenbank zu gewährleisten.

1.  **RLS aktivieren:** Gehen Sie zurück in den **Table Editor** von Supabase. Klicken Sie bei den Tabellen `users` und `time_entries` jeweils auf die drei Punkte und wählen Sie **"Enable Row Level Security (RLS)"**.
2.  **Policies erstellen:**
    *   Navigieren Sie zum **Authentication**-Tab (Personen-Icon) > **Policies**.
    *   Klicken Sie neben der `time_entries`-Tabelle auf **"New Policy"**.
    *   Erstellen Sie eine Policy, die es Benutzern erlaubt, ihre eigenen Einträge zu sehen. Wählen Sie z. B. **"Enable read access for everyone"**. Dies ist nur ein einfaches Beispiel. Für eine produktive Anwendung sollten Sie Policies erstellen, die sicherstellen, dass Benutzer nur ihre eigenen Daten sehen und bearbeiten können (z.B. mit der Bedingung `auth.uid() = user_id`).

Herzlichen Glückwunsch! Ihre Anwendung ist nun erfolgreich auf eine persistente Echtzeit-Datenbank mit Supabase migriert.