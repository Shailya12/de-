# Vigil — Full Enhancement Summary
## Everything Built, Changed, and Fixed

**Purpose of this document:** Complete reference for redesigning the Vigil app. Covers every screen, component, data model, and feature with current state and known gaps.

---

## 1. What the App Is

Vigil is a **building security check-in system** with two user types:

| User | Device | Route | Purpose |
|------|--------|-------|---------|
| Security Guard (Watchman) | Android phone | `/checkin` | Photographs and registers every visitor entering the building |
| Admin | iPhone / laptop / any browser | `/admin` | Views live visitor log, manages blocklist, exports records, flags threats |

The app runs as a **PWA (Progressive Web App)** — installed from Chrome browser, works like a native app, no Play Store needed yet.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Icons | lucide-react |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Authentication (email/password) |
| File Storage | Firebase Cloud Storage (visitor photos) |
| Hosting | Vercel (auto-deploys on git push) |
| Excel Export | xlsx library |

**Design system tokens (globals.css):**
```
--bg: #09090B          (page background)
--surface: #18181B     (sidebar, headers)
--card: #1C1C1F        (cards, inputs)
--border: ...          (dividers)
--text-1/2/3           (primary / secondary / muted text)
Primary gradient: #2563EB → #7C3AED (blue to purple)
```

---

## 3. File Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout — wraps AuthProvider + ErrorBoundary
│   ├── globals.css             Design system, utility classes, animations
│   ├── page.tsx                Landing / marketing page (/)
│   ├── login/page.tsx          Login page (/login)
│   ├── checkin/page.tsx        Watchman panel (/checkin)
│   ├── admin/page.tsx          Admin dashboard (/admin)
│   └── privacy/page.tsx        Privacy Policy (/privacy)
├── components/
│   ├── PhotoCapture.tsx        Camera capture + timestamp overlay
│   ├── CheckinForm.tsx         (Legacy — superseded by checkin/page.tsx inline form)
│   ├── VisitorDetailModal.tsx  Admin modal for visitor detail + actions
│   ├── BlocklistPanel.tsx      Add/remove blocklist entries
│   ├── AnalyticsPanel.tsx      Charts: 7-day trend, purpose breakdown, peak hours
│   └── ErrorBoundary.tsx       Catches JS crashes, shows reload screen
├── contexts/
│   └── AuthContext.tsx         Firebase auth state, role detection, resetPassword
├── lib/
│   ├── firebase.ts             Firebase app init
│   ├── firestore.ts            All Firestore CRUD + real-time subscriptions
│   └── storage.ts              Firebase Storage photo upload
├── types/index.ts              TypeScript interfaces (Visitor, BlocklistEntry, UserRole)
└── proxy.ts                    Next.js middleware — route protection via cookie
```

---

## 4. Every Screen — Current State

### 4.1 Landing Page (`/`)

**What it has:**
- Navbar: Vigil logo, Features + How it works anchor links, Sign In + Get Started CTAs
- Hero: Headline, subheading, mockup preview, dual CTAs
- Logo bar: "Trusted by" building types
- 9 feature cards with icons and descriptions
- How it works: 3-step process (Guard opens app → Entry recorded → Admins see live)
- Stats bar: <30s check-in, 100% cloud backup, 2 taps to checkout, ∞ records
- CTA section: "Ready to secure your building?"
- Footer: Logo, Privacy link (now working), Terms, Sign in

**What's missing:**
- No actual screenshots or mockups embedded
- Terms of Service page (link exists but page doesn't)
- No contact form or demo request
- Pricing section was intentionally removed

---

### 4.2 Login Page (`/login`)

**What it has:**
- Split-screen: Left panel with Vigil branding + feature list (desktop only), Right panel with form
- Email + password inputs
- Show/hide password toggle
- **Forgot password flow** (inline, no page navigation):
  - "Forgot password?" link next to Password label
  - Shows email input + Send Reset Link button
  - Success screen with green icon confirming which email was sent to
  - Back to sign in link
- Specific Firebase error codes displayed (wrong password, user not found, too many attempts, network error)
- "Back to homepage" link

**What's missing:**
- No "Remember me" option
- No SSO / Google login option

---

### 4.3 Watchman Panel (`/checkin`)

**What it has:**
- Live clock in header (HH:mm · DD MMM)
- Sign out button
- **Photo capture section** — opens device camera, adds timestamp overlay burned directly into photo using Canvas API
  - Canvas uses arcTo() fallback for older Android Chrome (no ctx.roundRect crash)
  - img.onerror handler prevents frozen UI on image load failure
  - Processing spinner during timestamp overlay generation
  - Clear button to retake photo
- **Registration form (single screen, no wizard):**
  - Name (required)
  - Phone number (required)
  - **Duplicate detection** — on phone blur, queries Firestore for same phone checked in within last 30 min. Shows yellow warning banner: "X checked in 12 minutes ago — already inside?"
  - Purpose selector: 5 emoji buttons in a row (Guest 👤, Delivery 📦, Meeting 🤝, Maintenance 🔧, Other 📋)
  - Collapsible "Additional details" section: Host/visiting person, Apartment/Floor, Vehicle number, ID photo capture
- **Real-time blocklist warning** — red alert if name or phone matches any blocked visitor
- **Submit button** — disabled until photo + name + phone all filled
- **Check-in flow (fixed order):**
  1. Generate visitor ID client-side (no DB write yet)
  2. Upload photo to Storage: `visitors/{id}/checkin.jpg`
  3. Upload ID photo if present: `visitors/{id}/id.jpg`
  4. Write Firestore record with real URLs (no orphaned __pending__ records)
- Success toast (3.5s, auto-hides, resets form)
- Error display with specific messages
- **Recent check-ins list** — last 6 visitors with quick Check Out button

**What's missing:**
- Offline queue (if internet drops mid-submit, entry is lost)
- Notes field on main form (currently in Additional Details)

---

### 4.4 Admin Dashboard (`/admin`)

**What it has:**

**Sidebar (collapsible, hamburger on mobile):**
- Vigil logo + "Admin Console" subtitle
- 3 nav items: Visitors (with live "N inside" count badge), Blocklist (with entry count), Analytics
- Admin profile avatar (first letter) + email
- Sign out button

**Top bar:**
- Hamburger menu (mobile)
- Search input (name or phone)
- Live "N inside" green pulsing badge
- Export button with hover dropdown: **CSV** and **Excel (.xlsx)** options

**Visitors view (default):**
- 4 stat cards: Today's Visitors, Currently Inside (animated dot), Checked Out Today, Flagged
- Filter bar: Date (Today / Yesterday / All time), Status (All / Inside / Left), Purpose (6 options), "Clear filters" button
- Record count display
- **Visitor table:**
  - Skeleton loader (6 shimmer rows) while Firestore connects — no empty flash
  - Desktop: grid columns (avatar, name+phone, purpose badge, check-in time, location, status)
  - Mobile: card layout with right-side status
  - Color-coded purpose badges
  - Flagged indicator (red dot on avatar)
  - Hover chevron
  - **Limited to 500 most recent records** (was unlimited — would break at scale)
- **Visitor Detail Modal** (click any row):
  - Large photo
  - Name, status badge, visit count (X total visits), Flagged badge
  - Details grid: Purpose, check-in/out time, host, apt/floor, vehicle, registered by
  - Notes section (if any)
  - ID document photo (if captured)
  - Actions: Mark Checked Out, Flag/Unflag, Add to Blocklist

**Blocklist view** (sidebar → Blocklist):
- Form: Name (required), Phone (optional), Reason (required)
- Entry list with name, phone, reason, date added, admin who added
- Delete button with loading state

**Analytics view** (sidebar → Analytics):
- 7-day visitor trend bar chart (pure CSS, today highlighted in blue)
- Purpose breakdown horizontal bars with percentages and color coding
- Peak hours heatmap (24 columns, green = very busy, blue = moderate)

**What's missing:**
- Guard account management (create/invite guards)
- Visitor statistics over longer periods (30/90 days)
- Push notifications for blocklist alerts
- Audit log of admin actions

---

### 4.5 Privacy Policy (`/privacy`)

Full page covering: data collected, how it's used, storage (Firebase/Google), retention, visitor rights, security model, contact. Footer link is live.

---

## 5. All Enhancements Made (Chronological)

### Sprint 1 — UI/UX Overhaul
- Replaced the original basic form with a complete professional redesign across all pages
- Built CSS custom properties design system in globals.css
- Created marketing landing page from scratch
- Redesigned login with split-screen branding panel
- Replaced 3-step check-in wizard with single-screen form (faster for guards)
- Built professional admin sidebar dashboard

### Sprint 2 — Bug Fixes
- **Fixed photo capture crash** on older Android — replaced `ctx.roundRect()` with manual `arcTo()` path
- **Fixed orphaned DB records** — reversed upload order: photo first, then Firestore write
- **Fixed search icon overlap** in admin panel — used inline style padding
- Removed pricing section from landing page
- Added specific Firebase error codes to login error display

### Sprint 3 — Code Quality
- Removed dead `activeView` state from admin page
- Changed `getRecentVisitors` to use Firestore `limit()` instead of JS `.slice()`
- Changed blocklist remove from soft-delete flag to `deleteDoc` (hard delete)
- Created composite Firestore index: `phone ASC + checkInTime DESC`

### Sprint 4 — Superpowers Framework + Features
- Installed superpowers skills into `.claude/commands/` (write-plan, execute-plan, dispatch-agents)
- **PWA manifest**: renamed to "Vigil — Visitor Management", theme `#2563EB`, `start_url: /checkin`
- **Skeleton loaders**: admin dashboard shows animated shimmer rows instead of empty flash
- **Duplicate check-in detection**: yellow warning when same phone checked in within 30 min
- Added `getRecentCheckInsByPhone()` Firestore helper with 3-field composite index

### Sprint 5 — Forgot Password
- Added `sendPasswordResetEmail` to AuthContext as `resetPassword()`
- Inline reset flow on login page — no page navigation needed
- Success confirmation screen with email address shown

### Sprint 6 — Analytics + Excel Export
- **AnalyticsPanel component**: 7-day bar chart, purpose breakdown, peak hours heatmap
- Analytics as 3rd tab in admin sidebar
- **Excel export** via xlsx library — hover Export button for CSV or Excel choice
- `getVisitorPage()` cursor-based pagination helper added to firestore.ts

### Sprint 7 — Production Hardening
- **Firestore security rules** tightened:
  - Guards can only create visitors + checkout (status/checkOutTime fields)
  - Only admins (via `config/admins` Firestore document) can flag, delete, manage blocklist
  - `config/admins` doc is client-readable but never client-writable
- **Storage rules**: uploads restricted to images only, max 5MB
- **Admin dashboard capped at 500 records** (was unlimited real-time load)
- **ErrorBoundary component**: catches any JS crash, shows branded reload screen instead of blank page
- **Composite index added**: `phone + status + checkInTime` for duplicate detection query
- **Privacy Policy page** at `/privacy` with full legal content

---

## 6. Data Model

### Firestore: `visitors/{visitorId}`
```
name: string                    (required)
phone: string                   (required)
photoUrl: string                (Firebase Storage URL, required)
idPhotoUrl?: string             (optional ID document photo)
purpose: Guest|Delivery|Meeting|Maintenance|Other
hostName?: string
apartmentFloor?: string
vehicleNumber?: string
notes?: string
checkInTime: Timestamp          (auto-set on creation)
checkOutTime?: Timestamp        (set on checkout)
status: 'checked-in'|'checked-out'
checkedInBy: string             (Firebase Auth UID)
checkedInByName: string         (display name / email)
flagged: boolean                (default false)
```

### Firestore: `blocklist/{entryId}`
```
name: string
phone: string
reason: string
addedBy: string                 (admin email)
addedAt: Timestamp
```

### Firestore: `config/admins` (manual, one-time setup)
```
emails: string[]                (array of admin email addresses)
```

### Firebase Storage
```
visitors/
  {visitorId}/
    checkin.jpg     (main photo with timestamp overlay)
    id.jpg          (ID document, optional)
```

---

## 7. Authentication & Routing

```
Public routes:     /    /login    /privacy
Guard routes:      /checkin    (requires any valid auth cookie)
Admin routes:      /admin      (requires checkin_auth=admin cookie)

Role detection:
  - Login → Firebase Auth → check email against NEXT_PUBLIC_ADMIN_EMAILS env var
  - Set cookie: checkin_auth=admin or checkin_auth=security
  - proxy.ts middleware enforces this on every request (Edge runtime)

Password reset:
  - Firebase sendPasswordResetEmail (built into login page)
  - Reset link sent to registered email address
```

---

## 8. Firestore Indexes Required

Both must be deployed via `firebase deploy --only firestore:indexes`:

| Collection | Fields | Used by |
|-----------|--------|---------|
| visitors | phone ASC + checkInTime DESC | Visit count in admin modal |
| visitors | phone ASC + status ASC + checkInTime DESC | Duplicate detection on check-in |

---

## 9. What Still Needs to Be Done

### Immediately (app may be broken):
- **New Firebase API key** — old one was exposed in git and auto-revoked by GitHub. Get from Firebase Console → Project Settings → Web App Config → update Vercel env var
- **Create `config/admins` Firestore document** — without it, admin-only actions (flag, blocklist) fail for everyone

### High Priority:
- **Guard account creation** — currently requires manual Firebase Console work. Need admin panel "Invite Guard" flow
- **Custom domain** — `de-gamma-swart.vercel.app` is not sellable. Buy `vigiapp.in` or similar → connect in Vercel
- **Terms of Service page** — footer link exists but page doesn't
- **Offline support** — if guard has no internet, check-in silently fails. Need a retry queue

### Medium Priority:
- **Push notifications** — admin gets alerted when a blocklisted visitor is detected at gate
- **Audit log** — record of all admin actions (who flagged/exported/deleted what)
- **Data retention** — auto-delete photos after 90 days (Firestore TTL + Cloud Tasks)
- **Automated tests** — zero test coverage currently

### Play Store:
- Privacy policy (done ✅), custom domain, screenshots, Capacitor APK via Android Studio, Google Play Console account ($25)

---

## 10. Known Constraints for Redesign

- **Next.js 16.2.1** has breaking changes from v14/v15 — uses `proxy.ts` not `middleware.ts`, and exports `proxy()` not `middleware()`
- **Tailwind v4** — config syntax differs from v3. CSS variables defined in `globals.css` via `@layer base`
- **Firebase client SDK only** — no server-side Firebase Admin. All auth/DB calls happen in the browser. This means some admin features (creating users) require workarounds
- **`force-dynamic`** in `layout.tsx` — required because Firebase SDK reads browser APIs that break static generation
- **Canvas `arcTo()` for timestamps** — must NOT use `ctx.roundRect()` as it crashes on Android Chrome < 99
- **Cookie-based auth** — `checkin_auth` cookie is set client-side (Firebase SDK) and read server-side (proxy.ts Edge middleware). Any auth changes must maintain this cookie flow

---

*Document generated: May 2026 | Repository: github.com/Shailya12/de-*
