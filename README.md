# Slide Handout

> Das Handout, das erst aufdeckt, wenn Sie es sagen.

Ein Presenter-gesteuertes Realtime-Fan-out-System: Vortragende schalten
Handout-Blöcke synchron zur PowerPoint-Folie frei, hunderte Zuhörer sehen
den neuen Block live im Browser — ohne Login, ohne Polling.

Live: **[handout.einfachmxrc.de](https://handout.einfachmxrc.de)**

---

## Feature-Überblick

- **Markdown-basierter Block-Editor** mit Live-Preview, Reorder über ↑/↓,
  Duplizieren und In-place-Edit
- **Presenter-Session** mit Space/→ = nächster Reveal, ←/Backspace = zurück,
  Bulk-Reveal, Live-Audience-Count (Heartbeat alle 20 s)
- **Audience-Reader** als React Server Component für Zero-JS Initial-Paint,
  dann WebSocket-Delta-Subscription nur für neue Reveals
- **PowerPoint Add-in** mit Pairing-Code-Auth (Office-Sandbox-safe, keine
  Cookies nötig) — sendet Folienwechsel live an die Session
- **Handout-Customization**: Akzentfarbe, Cover-Bild, Logo, Schriftart,
  Theme-Override, Footer-Markdown
- **Block-Layouts**: Default / Zentriert / Breit / Kompakt / **Terminal**
  (macOS-Frame + Zeile-für-Zeile Tipp-Animation + Status-Varianten ✓/✗)
- **Security**: Argon2id-Passwort-Hashing, SHA-256 Session-Token-at-Rest,
  `rehype-sanitize` gegen XSS, strikte CSP + HSTS + Rate-Limits,
  Defense-in-Depth (Zod client + Convex `v.*` server)

---

## Tech-Stack (April 2026)

| Ebene | Technologie |
|---|---|
| Frontend | **Next.js 16.2** App Router, React 19, Turbopack |
| Sprache | **TypeScript 6.0** (strict-by-default, ESM-default, `#/`-subpath) |
| Styling | **Tailwind CSS v4.2** mit `@theme` (keine `tailwind.config.js`) |
| Backend | **Convex Cloud** (Realtime-DB, Subscriptions, strikte Q/M-Trennung) |
| Validierung | **Zod 4** client-seitig, Convex `v.*` server-seitig |
| Auth | **Argon2id** (`@node-rs/argon2`) in Next.js Node-Runtime |
| Markdown | ReactMarkdown + remark-gfm + rehype-sanitize |
| Office | Office.js Task-Pane Add-in |
| Deploy | Docker (`output: "standalone"`), Caddy Reverse-Proxy, VServer |

---

## Projekt-Struktur

```
.
├── apps/
│   └── web/                     # Next.js App Router
│       ├── app/
│       │   ├── (auth)/          # Login + Register
│       │   ├── (dashboard)/     # Handouts, Session, Editor
│       │   ├── h/[token]/       # Audience-Reader (RSC + Client-Subscribe)
│       │   ├── api/             # Route Handlers (runtime: "nodejs")
│       │   └── globals.css      # Tailwind v4 @theme
│       ├── components/          # Reader, Editor, Session, Landing …
│       ├── lib/                 # Auth, Convex-Boundary, Zod, Sanitize
│       ├── public/powerpoint-addin/
│       │                        # Static manifest.xml + taskpane.html/js
│       ├── proxy.ts             # Next 16 "middleware" mit CSP
│       └── Dockerfile           # multi-stage standalone build
├── convex/                      # Backend (Schema, Queries, Mutations, Actions)
│   ├── schema.ts
│   ├── auth.ts  users.ts  handouts.ts
│   ├── blocks.ts  reveals.ts  sessions.ts
│   ├── audience.ts              # Heartbeat + Live-Count
│   ├── storage.ts               # S3-Presigning Action
│   ├── crons.ts                 # (Rate-Limit läuft in-memory in apps/web/lib/auth/rate-limit.ts)
│   └── lexorank.ts              # Fractional Ranking
├── .deploy/                     # Python-Scripts für VServer-Setup
└── docker-compose.yml           # handout-web Service (Caddy-ready)
```

---

## Lokales Setup

```bash
git clone https://github.com/EinfachMxrc/slide-handout.git
cd slide-handout
pnpm install

# Convex-Deployment einrichten
cd convex && npx convex dev     # interaktiv einloggen, Team + Projekt wählen
                                # → liefert NEXT_PUBLIC_CONVEX_URL

cp apps/web/.env.example apps/web/.env.local
# In .env.local eintragen:
#   NEXT_PUBLIC_CONVEX_URL=<aus convex dev>
#   CONVEX_DEPLOY_KEY=<aus convex dashboard>
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Zwei Terminals parallel:
pnpm dev:convex    # synchronisiert Schema live
pnpm dev:web       # Next.js auf :3000
```

---

## Production-Deploy

Docker-basiert, Caddy terminiert TLS (automatisches Let's Encrypt).

```bash
export DEPLOY_HOST=<ip>
export DEPLOY_USER=root
export DEPLOY_PASS='<pwd>'
export CONVEX_URL='https://<slug>.convex.cloud'
export CONVEX_DEPLOY_KEY='<key>'
export SITE_URL='https://handout.example.com'
export SITE_DOMAIN='handout.example.com'

python .deploy/01_bootstrap.py   # Node 20 + pnpm + UFW auf frischer VM
python .deploy/02_upload.py      # Code + .env hochladen
python .deploy/03_run.py         # docker compose up + Caddyfile-Erweiterung
```

Siehe [`.deploy/README.md`](./.deploy/README.md) für alle Env-Vars und
Details.

---

## Architektur-Highlights

### Delta-only Realtime-Fan-out

Pro Audience-Client läuft **genau eine** Convex-Subscription auf
`reveals.streamForSession`. Sie liefert pro Reveal nur
`{ blockId, revealedAt }` (~50 Bytes). Neue Block-IDs werden **gebatcht**
über `blocks.byIds(ids[])` nachgeladen — keine N parallelen Subscriptions
pro Zuhörer. Das skaliert auf hunderte gleichzeitige Hörer pro Session.

### Auth in Next-Node, nicht in Convex

Argon2id-Hashing, Cookie-Ausgabe und Session-Rotation passieren
ausschließlich in Next.js Route Handlers (`runtime: "nodejs"`). Convex
speichert nur Session-Records — das vermeidet den Cold-Start-Overhead der
Convex-Actions, die sonst für Argon2 nötig wären.

### LexoRank statt Float-Order

Blöcke haben `rank: string` (LexoRank), nicht `order: number`. Reorder und
Duplicate erzeugen neue Ränge via `rankBetween(prev, next)` — kein
Rebalancing, kein Overflow bei häufigen Inserts.

### Idempotente Reveals

`reveals.reveal(sessionId, blockId)` prüft innerhalb der transaktionalen
Mutation via Index `by_session_block`, ob bereits ein Record existiert.
Convex hat keine deklarativen Unique-Constraints — die Transaktion
erledigt das sauber.

### Office-Add-in ohne Cookie-Sharing

Der PowerPoint-Add-in läuft in einem Office-Sandbox-Origin und kann keine
Cookies vom Haupt-Site lesen. Stattdessen zeigt die Presenter-Session einen
**6-stelligen Pairing-Code**, den man im Task-Pane eintippt. Der Add-in
authentifiziert fortan alle Calls per Code.

---

## Mitwirken

Issues und Pull-Requests sind willkommen. Für größere Änderungen bitte
zuerst ein Issue öffnen, um die Richtung zu besprechen.

## Lizenz

[MIT](./LICENSE) — siehe `LICENSE` für den vollständigen Text.
