# Rebelein Stundenzettel

Eine Next.js-Anwendung für die Stundenzettel-Verwaltung mit Supabase als Backend.

## Einrichtung und Bereitstellung

Diese Anwendung ist so konzipiert, dass sie auf jeder modernen App-Hosting-Plattform (wie Netlify, Vercel oder ähnlichen) bereitgestellt werden kann.

### 1. Supabase-Projekt einrichten

1.  **Erstellen Sie ein neues Projekt** in Ihrem [Supabase Dashboard](https://supabase.com/dashboard).
2.  **Datenbankschema anwenden:**
    *   Navigieren Sie zum **SQL Editor** in Ihrem Supabase-Projekt.
    *   Öffnen Sie die Datei `supabase/schema.sql` aus diesem Repository.
    *   Kopieren Sie den gesamten Inhalt der Datei, fügen Sie ihn in den SQL-Editor ein und klicken Sie auf **"RUN"**. Dies erstellt die `time_entries`-Tabelle und konfiguriert die "Row Level Security"-Richtlinien, um die Daten der Benutzer zu schützen.

### 2. Anwendung konfigurieren

1.  **Umgebungsvariablen abrufen:**
    *   Gehen Sie in Ihrem Supabase-Projekt zu **Settings > API**.
    *   Kopieren Sie die **Project URL**.
    *   Kopieren Sie den **`anon` `public`** Schlüssel.

2.  **Umgebungsvariablen für die Bereitstellung festlegen:**
    *   Konfigurieren Sie die folgenden Umgebungsvariablen auf Ihrer Hosting-Plattform:
        *   `NEXT_PUBLIC_SUPABASE_URL`: Die URL Ihres Supabase-Projekts.
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Der `anon` `public`-Schlüssel Ihres Projekts.

### 3. Lokale Entwicklung (Optional)

1.  **Repository klonen.**
2.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
3.  **`.env.local`-Datei erstellen:**
    *   Erstellen Sie eine Datei namens `.env.local` im Hauptverzeichnis des Projekts.
    *   Fügen Sie Ihre Supabase-Anmeldeinformationen wie folgt hinzu:
        ```
        NEXT_PUBLIC_SUPABASE_URL=IHRE_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=IHR_ANON_PUBLIC_KEY
        ```
4.  **Entwicklungsserver starten:**
    ```bash
    npm run dev
    ```
    Die Anwendung ist nun unter `http://localhost:9002` verfügbar.

### Verwendete Technologien
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
