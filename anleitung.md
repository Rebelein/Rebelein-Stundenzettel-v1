# Anleitung: Migration zu Supabase & Docker

Diese Anleitung beschreibt, wie Sie die "Stundenzettel Meister"-Anwendung von der lokalen Speicherung im Browser (`localStorage`) auf eine persistente Echtzeit-Datenbank mit **Supabase** umstellen, die **lokal über Docker** betrieben wird. Zusätzlich wird die Next.js-Anwendung selbst ebenfalls dockerisiert.

## Vorteile dieser Architektur

*   **Vollständig lokale Entwicklung:** Arbeiten Sie komplett offline, ohne von Cloud-Diensten abhängig zu sein.
*   **Konsistente Umgebungen:** Docker stellt sicher, dass die Anwendung bei jedem Entwickler und in der Produktion identisch läuft.
*   **Echtzeit-Synchronisation & Persistenz:** Profitieren Sie von den Vorteilen einer echten Datenbank, die Daten sicher speichert und Änderungen in Echtzeit synchronisiert.

---

## Schritt 1: Voraussetzungen

Stellen Sie sicher, dass Sie [Docker](https://www.docker.com/products/docker-desktop/) auf Ihrem System installiert haben. Docker Desktop enthält in der Regel auch Docker Compose.

---

## Schritt 2: Supabase lokal einrichten

Wir erstellen eine `docker-compose.yml` Datei, um alle notwendigen Supabase-Dienste (Datenbank, Authentifizierung, Storage etc.) lokal zu starten.

1.  **Projektstruktur anlegen:**
    Erstellen Sie im Hauptverzeichnis Ihres Projekts einen Ordner namens `supabase`.

2.  **`docker-compose.yml` für Supabase erstellen:**
    Erstellen Sie in diesem neuen `supabase`-Ordner eine Datei namens `docker-compose.yml` mit folgendem Inhalt:

    ```yaml
    version: '3.8'

    services:
      db:
        image: supabase/postgres:15.1.0.118
        restart: unless-stopped
        environment:
          - POSTGRES_USER=postgres
          - POSTGRES_PASSWORD=postgres
          - POSTGRES_DB=postgres
        volumes:
          - ./volumes/db:/var/lib/postgresql/data
        ports:
          - "5432:5432"

      studio:
        image: supabase/studio:20240325
        restart: unless-stopped
        environment:
          - SUPABASE_URL=http://localhost:8000
          - SUPABASE_DB_HOST=db
          - SUPABASE_DB_PORT=5432
          - SUPABASE_DB_USER=postgres
          - SUPABASE_DB_PASSWORD=postgres
          - SUPABASE_DB_NAME=postgres
        ports:
          - "5433:3000"
        depends_on:
          - db

    volumes:
      db:
    ```

3.  **Supabase starten:**
    Navigieren Sie im Terminal in den `supabase`-Ordner und führen Sie folgenden Befehl aus:

    ```bash
    docker-compose up -d
    ```
    
    Supabase ist nun lokal gestartet. Sie können das Supabase Studio (ein grafisches Dashboard) unter `http://localhost:5433` in Ihrem Browser öffnen.

4.  **Lokale Projekt-Schlüssel:**
    Für die lokale Supabase-Instanz benötigen Sie die folgenden Werte:
    *   **Project URL:** `http://localhost:54321` (Dies ist die URL des Kong Gateways, das standardmäßig von Supabase verwendet wird, auch wenn wir es hier nicht explizit definieren. Für eine einfache Einrichtung reicht dies.)
    *   **`anon` `public` Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0` (Dies ist der Standard-Anon-Key für lokale Supabase-Instanzen).

---

## Schritt 3: Datenbank-Tabellen erstellen

Navigieren Sie zum lokalen Supabase Studio (`http://localhost:5433`) und dort zum **Table Editor** (Tabellen-Icon).

### a) Tabelle für Benutzer (`users`)
1.  Klicken Sie auf **"Create a new table"**.
2.  Tabellenname: `users`
3.  Spalten:
    *   `id`: `uuid` (Primary Key)
    *   `name`: `text`
4.  Klicken Sie auf **"Save"**.

### b) Tabelle für Zeiteinträge (`time_entries`)
1.  Klicken Sie erneut auf **"Create a new table"**.
2.  Tabellenname: `time_entries`
3.  Spalten:
    *   `id`: `uuid` (Primary Key)
    *   `date`: `date`
    *   `customer`: `text`
    *   `hours`: `float8`
    *   `user_id`: `uuid`
4.  **Beziehung (Foreign Key) erstellen:**
    *   Klicken Sie bei der `user_id`-Spalte auf das Beziehungs-Icon (Kettenglied).
    *   Wählen Sie die `users`-Tabelle und die `id`-Spalte aus.
    *   Klicken Sie auf **"Save"**.
5.  Klicken Sie auf **"Save"**, um die Tabelle zu erstellen.

---

## Schritt 4: Next.js-Anwendung dockerisieren & integrieren

### a) Supabase-Client anpassen
Öffnen Sie `src/lib/supabaseClient.ts` und passen Sie den Code an, um die lokalen Schlüssel zu verwenden (idealerweise über Umgebungsvariablen).

```typescript
import { createClient } from '@supabase/supabase-js';

// Diese Werte werden später über die docker-compose.yml bereitgestellt
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### b) `Dockerfile` für die Next.js-App erstellen
Erstellen Sie im Hauptverzeichnis des Projekts (auf der gleichen Ebene wie `package.json`) eine Datei namens `Dockerfile`:

```dockerfile
# 1. Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Build the app
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Run the app
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### c) Globale `docker-compose.yml` erstellen
Erstellen Sie im Hauptverzeichnis des Projekts eine weitere `docker-compose.yml`-Datei. Diese wird unsere Next.js-App und die Supabase-Dienste (die wir über die andere `docker-compose.yml` referenzieren) verwalten.

```yaml
version: '3.8'

services:
  # Next.js App
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      # Supabase-Variablen an die App übergeben
      - NEXT_PUBLIC_SUPABASE_URL=http://kong:8000
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
    depends_on:
      - kong # Stellt sicher, dass Supabase läuft, bevor die App startet
    networks:
      - default
      - supabase_network

  # Supabase Services
  # Wir binden hier die Dienste aus der anderen Compose-Datei ein
  # Wichtig: Wir müssen hier die Dienste explizit auflisten, die für die App erreichbar sein sollen
  
  postgres:
    image: supabase/postgres:15.1.0.118
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
    networks:
      - supabase_network

  kong:
    image: supabase/kong:2.8.1-alpine
    environment:
      - KONG_DATABASE=off
      - KONG_DECLARATIVE_CONFIG=/var/lib/kong/kong.yml
      - KONG_PROXY_LISTEN=0.0.0.0:8000
      - KONG_ADMIN_LISTEN=0.0.0.0:8001
    ports:
      - "54321:8000" # Externe URL für den Zugriff vom Host
    volumes:
      - ./supabase_kong.yml:/var/lib/kong/kong.yml
    networks:
      - supabase_network

  # ... weitere Supabase-Dienste wie gotrue, storage, etc. müssten hier
  # analog zur offiziellen Supabase Docker-Anleitung hinzugefügt werden.
  # Für diese App reichen erstmal Kong und Postgres.

networks:
  supabase_network:
    driver: bridge

volumes:
  supabase_db_data:
```

Sie benötigen außerdem eine `supabase_kong.yml` im Hauptverzeichnis:
```yaml
_format_version: "2.1"
services:
  - name: db
    url: http://postgres:5432
    routes:
      - name: db-route
        paths:
          - /
```
**Hinweis:** Ein voll funktionsfähiges lokales Supabase-Setup ist komplexer. Die obige Konfiguration ist ein vereinfachtes Beispiel. Für volle Funktionalität (Auth, Storage) folgen Sie am besten der offiziellen [Supabase Local Dev Anleitung](https://supabase.com/docs/guides/cli/local-development).

---

## Schritt 5: Alles zusammen starten

1.  **Alte Supabase-Container stoppen:**
    Falls Ihre Supabase-Instanz aus Schritt 2 noch läuft, stoppen Sie sie:
    ```bash
    cd supabase
    docker-compose down
    cd .. 
    ```

2.  **Gesamte Anwendung starten:**
    Führen Sie im Hauptverzeichnis des Projekts aus:
    ```bash
    docker-compose up --build
    ```
    Dieser Befehl baut das Image für Ihre Next.js-App und startet sowohl die App als auch die Supabase-Dienste.

3.  **Anwendung aufrufen:**
    Ihre Stundenzettel-Anwendung ist nun unter `http://localhost:3000` erreichbar und mit der lokalen Supabase-Datenbank verbunden.

Die restlichen Schritte zur Anpassung der Anwendungslogik (Daten laden, hinzufügen, etc.) aus der ursprünglichen Anleitung bleiben gleich. Der einzige Unterschied ist, dass die App nun nicht mehr mit einer Cloud-Datenbank, sondern mit Ihrer lokalen Docker-Instanz von Supabase kommuniziert.
