# Rebelein Stundenzettel

Eine Next.js-Anwendung für Stundenzettel-Verwaltung mit Supabase Backend.

## Lokaler Betrieb mit Portainer und Supabase

### Voraussetzungen
- Docker und Docker Compose
- Portainer (für Container-Management)
- GitHub-Account (für GHCR)

### Setup

1. **GitHub Actions Build**
   - Der Workflow in `.github/workflows/build.yml` baut automatisch das Docker-Image bei Push zu `feat-liquid-glass-redesign` und pusht es zu GitHub Container Registry (GHCR).

2. **Lokaler Supabase starten**
   ```bash
   cd supabase
   docker-compose up -d
   ```
   - Supabase läuft dann auf `http://localhost:8000` (API) und `http://localhost:5433` (Studio).

3. **Anwendung mit Portainer deployen**
   - Öffne Portainer und erstelle einen neuen Stack.
   - Verwende die `docker-compose.local.yml` als Compose-Datei.
   - Stelle sicher, dass die Umgebungsvariablen gesetzt sind:
     - `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:8000` (für host networking) oder passe an deinen Setup an.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

4. **Zugriff**
   - App: `http://localhost:3000`
   - Supabase Studio: `http://localhost:5433`

### Entwicklung
- `npm run dev` für lokale Entwicklung.
- `npm run build` für Produktions-Build.

---

# Firebase Studio

Dies ist ein NextJS-Starter in Firebase Studio.

Um loszulegen, siehe src/app/page.tsx.
