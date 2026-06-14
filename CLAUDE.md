@AGENTS.md

---

<!-- claude-memory:start:project-context -->
## Project Context

- **Stack**: Next.js 16.2.6, TypeScript, Prisma, PostgreSQL, NextAuth v4, Tailwind CSS v4
- **Auth**: NextAuth v4, CredentialsProvider, JWT strategy, `NEXTAUTH_SECRET` required in `.env`
- **Roles**: `USER`, `VENUE_OWNER`, `EVENT_ORGANIZER`, `MODERATOR`, `ADMIN`
- **Repo**: `app/` (App Router), `components/`, `lib/`, `prisma/`, `utils/`
- **Path aliases**: `@/` → root, `@components/` → `components/`, `@lib/` → `lib/`
- **Issue tracking**: GitHub Issues on `KoRIOz675/software_engineering_project` — tickets follow story (#) → task (#) hierarchy
- **MVP tracked via GitHub issues** — stories are parent issues, tasks are child issues
<!-- claude-memory:end:project-context -->

<!-- claude-memory:start:technical-decisions -->
## Technical Decisions

- **Proxy** (`proxy.ts` at root, Next.js 16 renamed middleware→proxy): uses `getToken` from `next-auth/jwt`; role-based routing — redirects unauthenticated users to `/login`, authenticated users hitting auth routes to their role home
- **Geo search**: Haversine distance computed in-memory after DB fetch (no PostGIS); `lat+lng+radius` must all be provided together
- **Sort param in venues API**: `newest` | `accessibility` | `service` | `environment`; geo path sorts in-code, standard path uses Prisma `orderBy`
- **SearchBar vs FilterPanel**: SearchBar handles city + Near me (geo); FilterPanel handles category, minScore slider, sort — both update URL params
- **Events API default**: `dateFrom` defaults to `new Date()` (upcoming only) when not provided
- **avgScore on event detail**: computed at query time from `EventReview[]`, not cached — add caching if perf becomes issue
- **Client components pattern**: all pages use `"use client"` + `useEffect` for data fetching, matching existing venue pages pattern
- **`onPointerUp` for slider**: FilterPanel minScore slider updates URL only on pointer release, not on every drag tick
<!-- claude-memory:end:technical-decisions -->

<!-- claude-memory:start:tasks -->
## Tasks

### Find Activities
- ✅ `GET /api/venues` — city, category, minScore, geo (lat/lng/radius), sort filters
- ✅ `SearchBar` — city input + Near me button (geolocation, 10km default, clear link)
- ✅ `FilterPanel` — category radios, minScore slider, sort dropdown, mobile collapsible
- ✅ `/venues` page — sidebar layout with FilterPanel + VenuesList
- ✅ `GET /api/events` — dateFrom/dateTo filters, venueId, upcoming default, paginated
- ✅ `/events` page — date range filter, EventCard list, pagination (#53, #54 covered)

### Attend Event
- ✅ `GET /api/events/[id]` — full detail: venue scores, organizer, reviews, avgScore
- ✅ `/events/[id]` page — date/time, description, venue card with scores, reviews list, Add to Calendar stub

### Auth / Proxy
- ✅ `proxy.ts` — Next.js 16 proxy (replaces middleware); role-based routing via `getToken` + `getRoleHomePath`

### MVP Remaining
- 🔲 **Review Event** (#67 → #68 API, #69 UI) — `POST /api/events/[id]/reviews`, review form on detail page (score 1–10)
- 🔲 **Review Social Venue** (#58 → #59 rating API, #60 avg score cache, #61 form, #62 display)
- 🔲 **Venue creation form** (#42) — page at `/venues/create` (POST API already exists, VENUE_OWNER only)
- 🔲 **Event CRUD** (#78 → #79 API, #80 create form, #81 edit/delete, #82 dashboard)
- 🔲 **Admin user management** (#86 → #87 API ban/delete, #88 admin page)

### Closeable GitHub Issues (work done)
- Close: #74, #75, #76, #77 (attend event story + tasks)
- Close: #52, #53, #54 (search events by time — covered by events listing + date filter)
- Close: #48, #55, #56, #57 (venue location/proximity search — covered by SearchBar + FilterPanel)
- Close: #51 (FilterPanel built)
<!-- claude-memory:end:tasks -->

<!-- claude-memory:start:session-summary -->
## Session Summary
_Last updated: 2026-06-14_

- Removed conflicting `middleware.ts` (deprecated in Next.js 16); existing `proxy.ts` already handles auth + role-based routing
- Analyzed full MVP against codebase and GitHub issues; identified events, ratings, reviews, admin as missing
- Added `sort` param to `GET /api/venues`; refactored `SearchBar` to add Near me geolocation button
- Created `FilterPanel` component (category, minScore slider, sort) and updated `/venues` page layout
- Built full events API: `GET /api/events` (list+filters) and `GET /api/events/[id]` (detail+avgScore)
- Built `/events` listing page with date filter and `EventCard` component
- Built `/events/[id]` detail page with venue scores, reviews list, Add to Calendar stub
- MVP progress: Find Activities ✅, Attend Event ✅ — next: Review Event, Review Venue, Event CRUD, Admin
<!-- claude-memory:end:session-summary -->
