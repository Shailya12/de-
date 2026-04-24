# Plan: Vigil — Next Steps (Post-MVP Polish)

**Goal:** Deliver three independent improvements to the Vigil app: (1) fix PWA branding, (2) add skeleton loaders to admin dashboard, (3) add duplicate check-in detection on the watchman panel.

**Branch:** `claude/building-checkin-app-plan-NtAWx`

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript 5, Tailwind v4, Firebase Firestore, CSS custom properties design system (`--bg`, `--surface`, `--card`, `--text-1/2/3`, `--border`)

**Files Modified:**
- `public/manifest.json` — PWA branding update
- `src/app/admin/page.tsx` — skeleton loader while visitors load
- `src/app/checkin/page.tsx` — duplicate detection warning
- `src/lib/firestore.ts` — new `getRecentCheckInsByPhone()` helper

---

## Task 1: Fix PWA Manifest Branding
**File:** `public/manifest.json`

Update name from "Gate Check-in" to "Vigil", fix theme/background colors to match design system, and set start_url to `/checkin` so guards land directly on the watchman panel when launching from home screen.

```json
{
  "name": "Vigil — Visitor Management",
  "short_name": "Vigil",
  "description": "Professional visitor management for buildings, offices, and complexes",
  "start_url": "/checkin",
  "display": "standalone",
  "background_color": "#09090B",
  "theme_color": "#2563EB",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Verification:** `cat public/manifest.json` — confirm name is "Vigil — Visitor Management", theme_color is "#2563EB", start_url is "/checkin"

---

## Task 2: Add Skeleton Loader to Admin Dashboard
**File:** `src/app/admin/page.tsx`

Currently the admin dashboard shows a full-screen spinner while Firestore connects (`if (loading || !user)`). After login the visitors array starts empty, causing a flash of "No visitors found" before data arrives. Add a `visitorsLoading` state that starts `true` and flips to `false` on first snapshot, then render skeleton cards instead of the empty state.

### Step 2a: Add visitorsLoading state
In `src/app/admin/page.tsx`, find the state declarations block (around line 60) and add:

```typescript
const [visitorsLoading, setVisitorsLoading] = useState(true)
```

### Step 2b: Flip visitorsLoading in the snapshot listener
Find `subscribeToVisitors` call (around line 80) and update the callback:

```typescript
const unsub = subscribeToVisitors((all) => {
  setVisitors(all)
  setVisitorsLoading(false)   // ← add this line
})
```

### Step 2c: Add VisitorSkeleton component (inline, top of file before the page component)

```typescript
function VisitorSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="w-10 h-10 rounded-full" style={{ background: 'var(--surface)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded w-1/3" style={{ background: 'var(--surface)' }} />
        <div className="h-3 rounded w-1/4" style={{ background: 'var(--surface)' }} />
      </div>
      <div className="h-5 w-16 rounded-full" style={{ background: 'var(--surface)' }} />
      <div className="h-5 w-14 rounded-full" style={{ background: 'var(--surface)' }} />
    </div>
  )
}
```

### Step 2d: Replace the empty state with skeleton or empty message
Find the section that renders `filtered.length === 0` empty state (search for "No visitors found") and replace with:

```typescript
{visitorsLoading ? (
  <>
    {[...Array(6)].map((_, i) => <VisitorSkeleton key={i} />)}
  </>
) : filtered.length === 0 ? (
  <div className="py-16 text-center" style={{ color: 'var(--text-3)' }}>
    <User className="w-8 h-8 mx-auto mb-3 opacity-40" />
    <p className="text-sm">No visitors found</p>
  </div>
) : (
  // existing visitor rows render here
)}
```

**Verification:** `npm run build` — must complete with 0 errors. Visually: admin table shows animated shimmer rows while loading instead of empty flash.

---

## Task 3: Duplicate Check-in Detection
**Files:** `src/lib/firestore.ts`, `src/app/checkin/page.tsx`

When a guard enters a phone number that was checked in within the last 30 minutes, show a yellow warning banner: "⚠️ [Name] checked in 12 minutes ago — already inside?" This prevents accidental double check-ins without blocking the guard.

### Step 3a: Add getRecentCheckInsByPhone helper to firestore.ts
Add after the existing `getVisitorsByPhone` function (around line 102):

```typescript
/** Returns visitors checked in within the last N minutes with this phone, currently inside */
export async function getRecentCheckInsByPhone(phone: string, withinMinutes = 30): Promise<Visitor[]> {
  const cutoff = Timestamp.fromDate(new Date(Date.now() - withinMinutes * 60 * 1000))
  const q = query(
    collection(db, 'visitors'),
    where('phone', '==', phone),
    where('status', '==', 'checked-in'),
    where('checkInTime', '>=', cutoff),
    orderBy('checkInTime', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => toVisitor(d.id, d.data()))
}
```

### Step 3b: Add duplicateWarning state to checkin/page.tsx
In the state declarations block (around line 44), add:

```typescript
const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
```

### Step 3c: Add phone blur handler in checkin/page.tsx
Import `getRecentCheckInsByPhone` at the top with the other firestore imports, then add a handler:

```typescript
async function handlePhoneBlur() {
  if (phone.replace(/\D/g, '').length < 7) return
  const dupes = await getRecentCheckInsByPhone(phone)
  if (dupes.length > 0) {
    const mins = Math.round((Date.now() - dupes[0].checkInTime.getTime()) / 60000)
    setDuplicateWarning(`${dupes[0].name} checked in ${mins} minute${mins !== 1 ? 's' : ''} ago — already inside?`)
  } else {
    setDuplicateWarning(null)
  }
}
```

### Step 3d: Clear duplicate warning when phone changes
In the phone `<input>` onChange handler, add `setDuplicateWarning(null)`:

```typescript
onChange={(e) => { setPhone(e.target.value); setDuplicateWarning(null) }}
onBlur={handlePhoneBlur}
```

### Step 3e: Render duplicate warning banner in JSX
Place after the phone input field and before the purpose selector:

```typescript
{duplicateWarning && (
  <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm"
    style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}>
    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
    <span>{duplicateWarning}</span>
  </div>
)}
```

**Note:** `AlertTriangle` is already imported in checkin/page.tsx.

**Verification:** `npm run build` — 0 errors. Manually: enter a phone number of a recently checked-in visitor → warning appears on blur.

---

## Final Verification
```bash
npm run build
```
Expected: `✓ Compiled successfully` with 0 TypeScript errors.

Then commit:
```bash
git add -A
git commit -m "feat: PWA branding, skeleton loaders, duplicate check-in detection"
git push -u origin claude/building-checkin-app-plan-NtAWx
```
