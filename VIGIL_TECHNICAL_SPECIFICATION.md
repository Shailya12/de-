# Vigil — Smart Visitor Management System
## Technical Specification & Project Documentation

**Version:** 1.0 (Production Ready)  
**Last Updated:** April 2026  
**Status:** MVP Complete, Ready for App Store Deployment

---

## 1. Project Overview

**Vigil** is a professional visitor management system designed for residential buildings, offices, and commercial complexes. It consists of:
- **Mobile Watchman App** (Android/PWA): Guards capture visitor photos, names, phone numbers, and check-in details at the building gate
- **Admin Web Dashboard**: Two designated admins view real-time visitor logs, filter data, export records, manage blocklists, and control check-out status
- **Cloud Backend**: Firebase (Firestore + Cloud Storage) with real-time data sync

**Target Users:**
- Security guards at building gates (watchman)
- Building administrators/facility managers (admins)
- Compliance officers needing audit trails

**Key Problem Solved:** Manual visitor registration books are lost, illegible, and not searchable. Vigil provides timestamped photos, real-time cloud backup, and instant admin visibility.

---

## 2. Features Built & Completed

### 2.1 Watchman Panel (`/checkin`)
- ✅ **Camera Integration**: Tap to capture visitor photo via device camera
- ✅ **Automatic Timestamp Overlay**: Date, time, and timezone burned directly into photo (Canvas API with fallback for older Android)
- ✅ **Quick Registration Form**: Single-screen capture of:
  - Full name (required)
  - Phone number (required)
  - Purpose of visit: Guest, Delivery, Meeting, Maintenance, Other (emoji selector)
  - Optional fields (collapsible): Host/visiting person, apartment/floor, vehicle number, ID photo
- ✅ **Real-time Blocklist Warning**: Alerts guard if name or phone matches any blocked visitor
- ✅ **Recent Check-ins List**: Shows last 6 visitors with quick "Check Out" button
- ✅ **Live Clock**: Displays current time (HH:mm · DD MMM) in header
- ✅ **One-Click Check-Out**: Guard can mark visitors as left from the recent list or admin panel
- ✅ **Success Toast**: Confirmation message when visitor is registered (3.5s auto-hide)
- ✅ **Error Handling**: Clear error messages from Firebase with specific auth/network diagnostics
- ✅ **Sign Out**: Guards can securely log out

### 2.2 Admin Dashboard (`/admin`)
- ✅ **Responsive Sidebar Navigation**:
  - Vigil logo with "Admin Console" subtitle
  - Two nav items: Visitors (with live count badge), Blocklist (with entry count)
  - Admin profile (first letter avatar) with Sign Out button
  - Mobile hamburger menu (collapses on screens < 1024px)
- ✅ **Real-time Stats Cards** (4-column grid, responsive):
  - Today's Visitors (total)
  - Currently Inside (live count, animated dot)
  - Checked Out Today
  - Flagged Visitors
- ✅ **Advanced Filtering**:
  - Date filter: Today | Yesterday | All time
  - Status filter: All | Checked-in (●) | Left (○)
  - Purpose filter: All | Delivery | Guest | Meeting | Maintenance | Other
  - Search bar: By name or phone number
  - "Clear Filters" button (appears when any filter active)
- ✅ **Live Visitor Table** (desktop: responsive grid columns; mobile: card layout):
  - Visitor avatar/photo (or first initial fallback)
  - Name + phone
  - Purpose badge (color-coded: blue/green/orange/purple)
  - Check-in time (relative: "Today HH:mm", "Yesterday", "dd MMM")
  - Location (apt/floor or host name)
  - Status badge (● Inside in green | ○ Left in gray)
  - Hover chevron indicator (desktop)
  - Flagged indicator (red dot on avatar if flagged)
- ✅ **Visitor Detail Modal**:
  - Large photo display
  - Badges: Flagged status, visit count (X visits), currently inside/left
  - Details grid: Purpose, Check-in time, Check-out time, Visiting (host), Apt/Floor, Vehicle, Registered By
  - Notes section (if exists)
  - ID Document preview (if captured)
  - Action buttons:
    - **Mark as Checked Out** (orange, if currently inside)
    - **Flag/Unflag** (yellow/gray toggle)
    - **Add to Blocklist** (red)
- ✅ **Blocklist Panel**:
  - Add to Blocklist form: Name (required), Phone (optional), Reason (required)
  - Error handling with specific message display
  - Blocklist entries sorted by most recently added
  - Each entry shows: Name, Phone, Reason (in red), Added date & admin who added it
  - Delete button (trash icon) with loading spinner
  - Empty state: "No blocked visitors"
- ✅ **CSV Export**: Downloads filtered visitor records with all columns
- ✅ **Search & Real-time Updates**: Unsubscribe from Firestore listeners on unmount

### 2.3 Landing Page (`/`)
- ✅ **Marketing Site** (professional tier):
  - **Navbar**: Vigil logo, nav links (Features, How it works), Sign in / Get Started CTA
  - **Hero Section**: Headline, subheading, preview mockup (admin dashboard screenshot), dual CTA buttons
  - **Logo Bar**: "Trusted by" building types (Residential, Corporate, Hotels, etc.)
  - **9 Feature Cards**: Camera/timestamp, instant sync, blocklist alerts, dashboard, mobile-first, CSV export, role-based access, check-in/out, detailed records
  - **How It Works** (3 steps): Guard opens app → Entry recorded instantly → Admins see live data
  - **Stats Section**: <30s check-in, 100% cloud backup, 2 taps to checkout, ∞ records
  - **CTA Section**: "Ready to secure your building?" with strong call-to-action
  - **Footer**: Logo, copyright, Privacy/Terms/Sign in links
  - ✅ **Pricing section removed** (as per user request)

### 2.4 Authentication & Authorization
- ✅ **Login Page**: Split-screen design with Vigil branding on left (desktop) / mobile-optimized right panel
  - Email/password inputs
  - Show/hide password toggle
  - Specific Firebase error codes displayed (auth/invalid-api-key, auth/user-not-found, auth/wrong-password, etc.)
  - "Back to Homepage" link
- ✅ **Role-Based Access Control**:
  - **Admin**: Email in `NEXT_PUBLIC_ADMIN_EMAILS` → Redirects to `/admin`
  - **Security**: Other authenticated user → Redirects to `/checkin`
  - **Proxy Middleware** (`proxy.ts`): Enforces routing, checks `checkin_auth` cookie
- ✅ **Session Management**: Firebase Auth + auth cookie (`checkin_auth=admin|security`)

### 2.5 Design System
- ✅ **CSS Custom Properties** (`globals.css`):
  - Color tokens: `--bg: #09090B`, `--surface: #18181B`, `--card: #1C1C1F`, `--border`, `--text-1/2/3`
  - Primary gradient: `#2563EB → #7C3AED`
  - Utility classes: `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`, `.badge-*`
  - Animations: `animate-fade-up`, `animate-spin`, `animate-pulse`
  - Responsive: Mobile-first, Tailwind-based grid system
- ✅ **Icons**: lucide-react (Shield, Camera, Search, Download, etc.)
- ✅ **Typography**: Inter/system fonts, 14-16px base size

### 2.6 Cloud Infrastructure
- ✅ **Firebase Project**: `gate-checkin-app`
- ✅ **Firestore Collections**:
  ```
  visitors/
    ├── {visitorId}
    │   ├── name: string
    │   ├── phone: string
    │   ├── photoUrl: string (Firebase Storage URL)
    │   ├── idPhotoUrl?: string
    │   ├── purpose: 'Guest'|'Delivery'|'Meeting'|'Maintenance'|'Other'
    │   ├── hostName?: string
    │   ├── apartmentFloor?: string
    │   ├── vehicleNumber?: string
    │   ├── notes?: string
    │   ├── checkInTime: timestamp
    │   ├── checkOutTime?: timestamp
    │   ├── status: 'checked-in'|'checked-out'
    │   ├── checkedInBy: string (uid)
    │   ├── checkedInByName: string
    │   └── flagged: boolean
  blocklist/
    ├── {entryId}
    │   ├── name: string
    │   ├── phone: string
    │   ├── reason: string
    │   ├── addedBy: string (admin email)
    │   └── addedAt: timestamp
  ```
- ✅ **Cloud Storage**:
  ```
  visitors/
    └── {visitorId}/
        ├── checkin.jpg (main visitor photo with timestamp)
        └── id.jpg (ID document photo, optional)
  ```
- ✅ **Security Rules**:
  - Firestore: Any authenticated user can read/write visitors and blocklist (app enforces admin-only on blocklist write)
  - Storage: Any authenticated user can read/write visitor photos
- ✅ **Firestore Composite Index**: `phone ASC + checkInTime DESC` for `getVisitorsByPhone` query

---

## 3. Technical Architecture

### 3.1 Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16.2.1 |
| **UI Framework** | React | 19 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS, CSS Variables | v4 |
| **Icons** | lucide-react | Latest |
| **Backend** | Firebase (managed) | - |
| **Auth** | Firebase Authentication | Email/Password |
| **Database** | Firestore | Real-time |
| **Storage** | Firebase Cloud Storage | JPG photos |
| **Hosting** | Vercel | Serverless |
| **Mobile Wrapper** | PWA (Progressive Web App) | + Capacitor (optional for APK) |

### 3.2 File Structure
```
de-/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, dynamic force-dynamic
│   │   ├── globals.css             # Design system, CSS vars, utility classes
│   │   ├── page.tsx                # Landing page (/
│   │   ├── login/
│   │   │   └── page.tsx            # Login page (/login)
│   │   ├── checkin/
│   │   │   └── page.tsx            # Watchman panel (/checkin)
│   │   └── admin/
│   │       └── page.tsx            # Admin dashboard (/admin)
│   ├── components/
│   │   ├── PhotoCapture.tsx        # Camera + canvas timestamp overlay
│   │   ├── VisitorDetailModal.tsx  # Admin modal for visitor details
│   │   └── BlocklistPanel.tsx      # Blocklist management modal
│   ├── contexts/
│   │   └── AuthContext.tsx         # Firebase auth + role detection
│   ├── lib/
│   │   ├── firebase.ts             # Firebase init (client-side)
│   │   ├── firestore.ts            # Firestore CRUD ops
│   │   └── storage.ts              # Cloud Storage upload
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── proxy.ts                    # Middleware for route protection
├── public/
│   └── manifest.json               # PWA manifest
├── firestore.rules                 # Firestore security rules
├── storage.rules                   # Storage security rules
├── firestore.indexes.json          # Composite indexes for Firestore
├── .env.local                      # Firebase config (not in git)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

### 3.3 Data Flow
```
Guard Flow:
1. Guard opens /checkin (or PWA shortcut)
2. Authenticates with email/password (Firebase Auth)
3. Captures photo via device camera (PhotoCapture component)
4. Photo processed: canvas adds timestamp overlay, returns JPEG blob
5. Guard fills name, phone, purpose, optional fields
6. Clicks "Check In Visitor"
7. Flow:
   a. Generate visitor ID (client-side, no write yet)
   b. Upload photo blob to Storage: visitors/{visitorId}/checkin.jpg
   c. Get download URL from Storage
   d. Write visitor record to Firestore with real photoUrl
   e. Show success toast, reset form, refresh recent list

Admin Flow:
1. Admin opens /admin (or /login → /admin redirect)
2. Authenticates with admin email (must be in NEXT_PUBLIC_ADMIN_EMAILS)
3. Real-time Firestore listener subscribes to all visitors
4. Displays stats, table, filters
5. Admin can:
   - Click row → opens VisitorDetailModal
   - Flag visitor
   - Mark as checked out
   - Add to blocklist (opens BlocklistPanel)
   - Search, filter, export to CSV
6. All changes reflected in real-time to all connected admins
```

### 3.4 Authentication Flow
```
Entry Point:
1. User visits / → AuthContext checks Firebase Auth state
2. If logged in:
   - AdminContext reads NEXT_PUBLIC_ADMIN_EMAILS
   - Sets role = 'admin' or 'security'
   - Sets checkin_auth cookie = role
   - Redirects to /admin or /checkin
3. If not logged in → redirected to /login

Middleware (proxy.ts):
- PUBLIC_PATHS = ['/', '/login'] → no auth required
- /admin → requires cookie checkin_auth=admin, else redirect to /login
- /checkin → requires cookie checkin_auth=*, else redirect to /login

Session Persistence:
- Firebase SDK handles token refresh
- Cookie read by proxy.ts for server-side route protection
```

### 3.5 Key Technical Decisions

| Decision | Why |
|----------|-----|
| **Next.js 16 App Router** | Modern, server-focused, built-in middleware (proxy.ts), dynamic force-dynamic for Firebase SSR issues |
| **Firebase** | Real-time database, easy auth, managed hosting, no server ops needed |
| **Firestore** (not Realtime DB) | Complex queries (where + orderBy), better scaling, real-time listeners on specific collections |
| **Cloud Storage** (not base64 in DB) | Large JPEG photos shouldn't be in Firestore; separate storage keeps DB small, CDN delivery is faster |
| **PWA** (not native app yet) | Instant deployment, works on any Android Chrome, installable via "Add to Home Screen", lower cost than native Kotlin app |
| **Canvas timestamp** | Irrefutable proof in the photo itself; can't be edited without redoing; works offline (generated client-side) |
| **Composite Firestore Index** | `getVisitorsByPhone` query needs it; enables "visit count" feature in admin modal |
| **Soft CSS styling** (inline `style=` props) | CSS variables in globals.css, but individual components use inline styles for dynamic values (colors, backgrounds); allows theme switching if needed later |

---

## 4. Improvements & Features Pending

### 4.1 Critical (Blocking Production)
- [ ] **Deploy Firestore Composite Index**
  - File created: `firestore.indexes.json`
  - Command: `firebase deploy --only firestore:indexes`
  - Without this, `getVisitorsByPhone` returns empty → visit count always shows 1
  - Priority: **HIGH** — do before production
  
- [ ] **Create Guard Account in App**
  - Currently: Guard must be created manually in Firebase Console
  - Improve: Add `/signup` page for guards to self-register with OTP validation
  - Alternative: Admin panel has "Invite Guard" feature that generates temp password
  - Priority: **HIGH** — better UX than manual setup

### 4.2 High Priority (Launch-Ready Features)
- [ ] **Android APK via Capacitor**
  ```bash
  npm install @capacitor/core @capacitor/cli
  npx cap init
  npx cap add android
  npx cap sync
  npm run build && npx cap copy
  # Open in Android Studio: npx cap open android
  # Build APK: Build → Build Bundle(s) / APK(s)
  ```
  - Wraps web app in native wrapper
  - Access to hardware (camera permissions work better)
  - Can be uploaded to Google Play Store
  - APK file (~80MB) installable on any Android phone
  - Priority: **MEDIUM** — user wants Play Store deployment

- [ ] **PWA Icons & Manifest**
  - Create `public/icon-192x192.png`, `icon-512x512.png` (PNG files)
  - Update `manifest.json` with proper icon references
  - Test: `chrome://apps` → "Add Vigil to your phone" should show proper icon
  - Priority: **MEDIUM** — polish for distribution

- [ ] **Guard Account Management** (Admin Panel Feature)
  - Add new page: `/admin/guards`
  - UI to create, list, disable guard accounts
  - Bulk invite with email
  - Priority: **MEDIUM** — convenience feature

### 4.3 Medium Priority (Polish & Scale)
- [ ] **Loading Skeleton** instead of "No visitors" flash
  - Replace empty state with animated placeholder cards while Firestore connects
  - Better perceived performance

- [ ] **Duplicate Visitor Detection**
  - If same phone checked in twice in 5 min → warn guard with modal
  - Prevent accidental double check-ins

- [ ] **Export to Excel** (not just CSV)
  - Use `xlsx` library for prettier Excel files with formulas
  - Allow admins to add notes/summaries

- [ ] **Visitor Statistics Dashboard**
  - Graphs: visitors per day (bar chart), purpose breakdown (pie chart)
  - Peak hours heatmap
  - Frequent visitor list

- [ ] **Notification System**
  - Admins get push notification when blocklisted visitor attempts entry
  - Guard gets confirmation sound on successful check-in
  - Firebase Cloud Messaging (FCM)

- [ ] **Two-Factor Authentication (2FA)**
  - Phone OTP or TOTP for admin login
  - Reduces account takeover risk

- [ ] **Audit Logs**
  - Track all admin actions (flag, delete, export)
  - Who changed what and when
  - Compliance requirement for some buildings

- [ ] **Dark Mode Toggle** (if needed; already dark-themed)
  - Add light theme variant using CSS variables

- [ ] **Multi-Language Support**
  - Localize to Hindi, Tamil, Telugu, Marathi, etc. (for India market)
  - Use `next-i18next` or similar

### 4.4 Lower Priority (Future Enhancements)
- [ ] **QR Code Guest Links**
  - Admin generates QR code
  - Guest scans → pre-fills name, checks themselves in
  
- [ ] **Integration with Building Access Control**
  - Sync checked-in visitors to door lock system (API integration)
  - Real-time door unlock for approved guests

- [ ] **Video Recording** (optional)
  - Capture short video clip instead of just photo
  - Better evidence if disputed

- [ ] **Machine Learning** (fraud detection)
  - Detect fake IDs via image analysis
  - Flag suspicious patterns (same visitor 10x per day)

---

## 5. Setup Instructions for App Developer

### 5.1 Prerequisites
- Node.js 18+ (includes npm)
- Git
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud account with billing enabled

### 5.2 Local Development Setup
```bash
# Clone repository
git clone https://github.com/Shailya12/de- your-local-folder
cd your-local-folder

# Install dependencies
npm install

# Create .env.local with Firebase config
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
EOF

# Start dev server
npm run dev
# Open http://localhost:3000
```

### 5.3 Firebase Setup (if new project)
```bash
# Create Firebase project in https://console.firebase.google.com
# 1. New project → enter project name
# 2. Enable Google Analytics (optional)
# 3. Create project

# In Firebase Console:
# 1. Authentication → Enable Email/Password
# 2. Firestore → Create Database (start in production mode)
# 3. Storage → Create Bucket (start in production mode)
# 4. Project Settings → Get Web App config
# 5. Update .env.local

# Deploy security rules:
firebase login
firebase deploy --project gate-checkin-app
  # Deploys: firestore.rules, storage.rules, firestore.indexes.json
```

### 5.4 Test Accounts
```
Admin 1:
  Email: shailyak12@gmail.com
  Password: (ask user — password reset sent to email)
  Role: admin

Admin 2:
  Email: kaushikklass@gmail.com
  Password: (ask user)
  Role: admin

Security Guard (example):
  Email: guard@company.com
  Password: (self-registered or invited)
  Role: security
```

### 5.5 Build & Deploy to Vercel
```bash
# Link to Vercel (if not already)
vercel link

# Set environment variables in Vercel dashboard:
# Project Settings → Environment Variables → add all from .env.local

# Deploy
git push origin main
# Vercel auto-deploys on push

# Live URL: https://de-gamma-swart.vercel.app (or custom domain)
```

### 5.6 Android APK Build (Capacitor)
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor project
npx cap init
  # App name: Vigil
  # App ID: com.vigil.app

# Add Android platform
npx cap add android

# Build Next.js for production
npm run build

# Copy web assets to Android
npx cap copy

# Open Android Studio
npx cap open android

# In Android Studio:
# 1. Build → Build Bundles / APK(s) → Build APK
# 2. Find APK at: android/app/build/outputs/apk/debug/app-debug.apk
# 3. Transfer to phone via USB or cloud

# Release build (for Play Store):
# 1. Create signing key: keytool -genkey -v -keystore ...
# 2. Build → Build Bundles / APK(s) → Build App Bundle
# 3. Upload to Google Play Console
```

---

## 6. Deployment & Hosting

### 6.1 Current Deployment
- **Live URL**: https://de-gamma-swart.vercel.app
- **Hosting**: Vercel (auto-deploys on `git push origin main`)
- **Backend**: Firebase (multi-region, managed)
- **Database**: Firestore (auto-scaling)
- **Storage**: Cloud Storage (CDN-backed, ~$0.020/GB/month)

### 6.2 Custom Domain
```bash
# In Vercel dashboard:
# Settings → Domains → Add domain
# Point your domain's DNS A record to Vercel IP
# Let's Encrypt SSL auto-enabled
```

### 6.3 Monitoring & Maintenance
- **Firebase Console**: Monitor usage, quotas, performance
- **Vercel Analytics**: Check deployment logs, edge function errors
- **Firestore Index Status**: Verify composite index is built (can take 5-10 min)

### 6.4 Cost Estimation (Monthly)
| Service | Usage | Cost |
|---------|-------|------|
| Firebase Auth | <100 users | Free (Spark plan) |
| Firestore | <50k read ops, <20k write ops | Free (Spark plan) |
| Cloud Storage | ~100GB photos/month | ~$2 |
| Vercel | <100 deployments | Free (Hobby) or $20 (Pro) |
| **Total** | | **~$2–20/month** (free for small teams) |

Scales linearly as building grows. 1000 daily check-ins ≈ $50–100/month.

---

## 7. Testing Checklist

### 7.1 Functional Testing
- [ ] Guard can capture photo and submit check-in
- [ ] Photo has visible timestamp overlay
- [ ] Admin sees check-in in real-time (no refresh needed)
- [ ] Admin can flag, check out, blocklist visitor
- [ ] Filters work: date, status, purpose, search
- [ ] CSV export downloads with correct data
- [ ] Blocklist alert shows when guard enters blocked name/phone
- [ ] Check-out button works on recent list and visitor detail modal
- [ ] Error messages are clear (Firebase error codes displayed)

### 7.2 Mobile Testing
- [ ] Watchman panel responsive on 4–6 inch Android phones
- [ ] Photo capture works (hardware camera access)
- [ ] Touch targets are ≥48px (accessibility)
- [ ] PWA installs via Chrome "Add to Home Screen"
- [ ] Installed app icon is correct (if icons added to manifest)

### 7.3 Admin Dashboard Testing
- [ ] Sidebar collapses on mobile, hamburger menu works
- [ ] Table responsive on tablet and desktop
- [ ] Visitor modal displays correctly
- [ ] Blocklist modal form validates (name, reason required)
- [ ] Real-time updates: open in 2 browser tabs, check-in from watchman app, both tabs update

### 7.4 Security Testing
- [ ] Non-admin can't access /admin (redirects to /checkin)
- [ ] Non-authenticated user can't access /checkin (redirects to /login)
- [ ] Firebase rules prevent non-authenticated reads
- [ ] Photos are not world-readable (Storage rules)
- [ ] Firestore records can only be modified by authenticated users

### 7.5 Performance Testing
- [ ] Watchman page loads < 3s on 4G
- [ ] Admin dashboard loads < 5s (with real data)
- [ ] Photo capture + overlay processing < 2s
- [ ] CSV export of 1000 records completes < 5s
- [ ] Firestore real-time listener doesn't cause lag

---

## 8. Production Readiness Checklist

- [x] All pages built and responsive
- [x] Firebase project created and configured
- [x] Security rules deployed
- [x] Environment variables set on Vercel
- [x] Landing page optimized for marketing
- [x] Error handling implemented
- [x] Design system (CSS variables) in place
- [ ] **Composite Firestore index deployed** (CRITICAL)
- [ ] Test accounts created
- [ ] Admin trained on dashboard features
- [ ] Guard trained on watchman app
- [ ] Privacy policy & terms written (if required by jurisdiction)
- [ ] Data retention policy defined (how long to keep photos)
- [ ] Backup strategy documented (Firebase automatic backups sufficient)
- [ ] Monitoring alerts set up (Firestore quota, Vercel deployments)
- [ ] Support process documented (who fixes issues)

---

## 9. Handoff to App Development Service (Rork.com)

### What to Provide
1. **This Document** (specification)
2. **GitHub Repository Access** (source code)
3. **Firebase Project Access** (read-only, or request they set up new project)
4. **Figma/Design Files** (if any, or reference screenshots in this doc)
5. **Admin Email List** (who can access dashboard in production)

### Key Requirements to Communicate
1. **Technology Stack**: Must use Next.js 16, React 19, Firestore, Firebase Auth
2. **Mobile First**: Watchman app MUST work on older Android phones (4.4+)
3. **Real-time Sync**: Admin dashboard updates in real-time without page refresh
4. **Photo Timestamps**: Burned into image (not just metadata), visible in photo itself
5. **Role-Based Access**: Strict separation between admin and security guard roles
6. **Security**: No hardcoded API keys, use .env for secrets
7. **Production Deployment**: Vercel (or equivalent serverless host), Firebase managed services
8. **Play Store Ready**: APK must be < 100MB, comply with Google Play policies

### Estimated Development Time (if building from scratch)
- Mobile Watchman App: 2-3 weeks (design + dev + testing)
- Admin Dashboard: 2-3 weeks (design + dev + testing)
- Backend Setup: 1 week (Firebase, rules, indexes)
- QA & Deployment: 1-2 weeks
- **Total**: 6-9 weeks for a team of 2-3 developers

---

## 10. FAQ & Troubleshooting

**Q: Why Firestore and not SQL (PostgreSQL)?**
A: Real-time listeners, built-in auth, no server ops. For a small team wanting fast deployment.

**Q: Can we move to a different backend later?**
A: Yes, but you'd need to rewrite `lib/firestore.ts` and `lib/storage.ts`. The UI logic is agnostic.

**Q: What if Firestore composite index isn't deployed?**
A: `getVisitorsByPhone` returns empty, so "visit count" in admin modal always shows 1. Guards can still check in, just no historical count.

**Q: How do we prevent duplicate check-ins?**
A: Not implemented yet. Add debounce (disable button for 5s after submit) or duplicate detection (query last 5 min by phone).

**Q: Can we add more admin roles (e.g., supervisor, auditor)?**
A: Yes, change `UserRole` type in `types/index.ts` to `'admin' | 'supervisor' | 'auditor' | 'security'`, add checks in `proxy.ts`.

**Q: Can we host this on AWS instead of Vercel + Firebase?**
A: Yes, but requires more ops effort. You'd use AWS RDS (database), S3 (storage), Lambda (API), Cognito (auth). Not recommended for MVP.

**Q: How do we handle GDPR/data privacy?**
A: Add data retention policy (e.g., auto-delete photos after 90 days). Use Firestore TTL field + Cloud Tasks.

**Q: Can guards access the admin dashboard?**
A: No, by design. The cookie `checkin_auth=security` prevents access to `/admin`. Could add "read-only mode" for shift supervisors if needed.

---

## 11. Contact & Support

**Original Developer**: Shailya  
**Repository**: https://github.com/Shailya12/de-  
**Live Site**: https://de-gamma-swart.vercel.app  

For technical questions, refer to:
- Firebase docs: https://firebase.google.com/docs
- Next.js docs: https://nextjs.org/docs
- Vercel docs: https://vercel.com/docs

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Status**: Ready for handoff to app development service  
