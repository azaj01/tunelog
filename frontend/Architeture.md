## TODO:
- Clean up /layout/Appsidebar
- Some of the items are just commented out to prevent them from showing up
- Get a better Structure, now its messy, user, maintain user, user profile, add users


## Dashboard Components

- **MostPlaysbyUser** — shows which user has listened the most
- **MostHeardArtist** — shows top artists by play count
- **LibraryMetrics** — shows total songs in library and last sync time
- **MonthlyPlayed** — shows listens vs skips over time
- **MostSkippedSongs** — shows most skipped songs with skip percentage
- **TopSongsTable** — shows top songs with star ratings and signal badge
- **GenreDistribution** — shows genre breakdown as a bar chart
- **StatisticsChart** - shows graph for diffrent user interactions



## Structure:

- **API** - API calls happens in /API/API.tsx

## Web UI Architecture

Built on TailAdmin (React + TypeScript + Vite). All API calls go through `/API/API.tsx`.

---

## Stack
- **React + TypeScript + Vite** — frontend framework
- **TailAdmin** — base UI component library
- **Tailwind CSS** — styling
- **React Router** — page navigation

---

## Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Main overview — library metrics, charts, top songs, artists |
| Users | `/profile` | User management — list, create users |
| Library Sync | `/librarySync` | Sync controls, progress, settings |
| Sign In | `/signin` | Login page — authenticates against Navidrome |

---

## Dashboard Components

| Component | Description |
|---|---|
| `LibraryMetrics` | Total songs in library, total listens, signal breakdown |
| `MostHeardArtist` | Top artists by play count |
| `MostSkippedSongs` | Most skipped songs with skip percentage |
| `MostPlaysbyUser` | Which user has listened the most |
| `MonthlyPlayed` | Listens vs skips over time (line/bar chart) |
| `GenreDistribution` | Genre breakdown as a bar chart |
| `StatisticsChart` | Graph for different user interaction signals |
| `TopSongsTable` | Top songs with star ratings and signal badge |

---

## Auth Flow
```
User opens any page
        ↓
Check localStorage → then sessionStorage for tunelog_token
        ↓
Not found → redirect to /signin
Found → allow access
        ↓
On login → Navidrome JWT returned → stored in localStorage (keep me logged in)
        or sessionStorage (session only)
        ↓
Sign out → clears both storages → redirect to /signin
```

---

## API Layer (`/API/API.tsx`)

All API calls go through this single file. No component makes direct fetch calls.

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `fetchPing` | GET | `/api/ping` | Health check |
| `fetchStats` | GET | `/api/stats` | Dashboard data |
| `fetchSyncStatus` | GET | `/api/sync/status` | Sync state + library stats |
| `fetchSyncStart` | GET | `/api/sync/start` | Trigger fast or slow sync |
| `fetchSyncSettings` | GET | `/api/sync/setting` | Save auto sync hour + iTunes toggle |
| `fetchLogin` | POST | `/auth/login` | Authenticate user |
| `fetchCreateUser` | POST | `/admin/create-user` | Create user in Navidrome + DB |
| `fetchGetUsers` | POST | `/admin/get-users` | List all registered users |

---

## State Management

No global state library — each page manages its own state via `useState` and `useEffect`. Shared data (credentials) passed via localStorage/sessionStorage.

| Data | Storage |
|---|---|
| `tunelog_token` | localStorage or sessionStorage |
| `tunelog_user` | localStorage or sessionStorage |
| `tunelog_password` | localStorage or sessionStorage |

---

## Library Sync Page — Polling

Progress bar syncs with backend via polling:
- On button click → `startPolling()` fires immediately
- Polls `/api/sync/status` every 2 seconds
- Stops when `syncStartedRef = true` AND `is_syncing = false`
- Safety stop if `progress >= 100`
- `.catch()` on every poll — backend crash doesn't kill the interval

---

## TODO

- Clean up `/layout/AppSidebar` — several items commented out, needs proper structure
- Users page needs consolidation — currently has separate "Users", "Maintain User", "User Profile", "Add Users" items — should be one unified Users page
- Wire remaining dashboard components with real data — `MostPlaysbyUser`, `MonthlyPlayed`, `GenreDistribution`, `StatisticsChart` still using placeholder data
- Frontend Docker integration
- Add route guards to all protected pages (currently only Dashboard has token check)