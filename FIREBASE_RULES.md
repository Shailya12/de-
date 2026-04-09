# Firebase Security Rules

Deploy these rules to Firebase Console.

---

## Firestore Rules

Go to: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.email in [
          'shailya.gohil@gmail.com',
          'admin@gatecheckin.app'
        ];
    }
    
    function isSecurity() {
      return request.auth != null;
    }
    
    match /visitors/{visitorId} {
      allow read: if isSecurity();
      allow create: if isSecurity() 
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100
        && request.resource.data.phone is string
        && request.resource.data.phone.size() >= 10
        && request.resource.data.photoUrl is string
        && request.resource.data.photoUrl.size() > 0;
      allow update: if isSecurity() 
        && request.resource.data.diff(resource.data).affectedKeys().hasAll([
          'status', 'checkOutTime'
        ]);
      allow delete: if isAdmin();
    }
    
    match /blocklist/{entryId} {
      allow read: if isSecurity();
      allow write: if isAdmin();
    }
    
    match /preApprovals/{approvalId} {
      allow read: if isSecurity();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

---

## Storage Rules

Go to: https://console.firebase.google.com/project/YOUR_PROJECT_ID/storage/rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.email in [
          'shailya.gohil@gmail.com',
          'admin@gatecheckin.app'
        ];
    }
    
    function isAuth() {
      return request.auth != null;
    }
    
    match /visitors/{visitorId}/photos/{photoId} {
      allow read: if isAuth();
      allow write: if isAuth() 
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    match /visitors/{visitorId}/ids/{photoId} {
      allow read: if isAuth();
      allow write: if isAuth() 
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    match /{allPaths=**} {
      allow read: if isAuth();
    }
  }
}
```

---

## Deployment

Deploy via Firebase CLI:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Or use the Firebase Console web interface.

---

## Required Environment Variables

In `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gate-checkin-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gate-checkin-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_ADMIN_EMAILS=shailya.gohil@gmail.com,admin@gatecheckin.app
```