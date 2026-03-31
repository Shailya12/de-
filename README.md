# Gate Check-in

Building visitor check-in and registration system.

## What it does

- **Security guard app** (mobile PWA, installable on Android): register visitors entering the building — photo with timestamp, name, phone, purpose, host, vehicle number
- **Admin panel** (web, works on iPhone): real-time visitor logs, search/filter, visitor details, check-out, flag visitors, blocklist management, CSV export

## Setup

### 1. Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Sign-in method → Email/Password**
3. Create a **Firestore** database (production mode)
4. Create a **Storage** bucket (production mode)
5. Go to **Project Settings → Your apps → Add Web app** and copy the config

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase config keys and the two admin email addresses:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_ADMIN_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com
```

### 3. Firebase security rules

Paste `firestore.rules` into **Firestore → Rules** and `storage.rules` into **Storage → Rules** in the Firebase console.

### 4. Create user accounts

In **Firebase Auth → Users**, add accounts for:
- The 2 admin email addresses (matching `NEXT_PUBLIC_ADMIN_EMAILS`)
- Security guard accounts (any other email)

### 5. Run

```bash
npm install
npm run dev
```

## Deployment

Deploy to [Vercel](https://vercel.com) and add all `NEXT_PUBLIC_*` environment variables in the Vercel project settings.

### Installing on the security guard's Android phone

1. Open the deployed URL in **Chrome**
2. Tap the menu (⋮) → **Add to Home Screen**
3. The app installs and runs fullscreen like a native app

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/login` | Everyone | Sign in |
| `/checkin` | Security guards | Register visitors |
| `/admin` | Admins only | View logs, manage blocklist |
