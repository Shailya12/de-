# Firebase Security Rules

Paste these into your Firebase Console.

## 1. Firestore Rules
[Go to Firestore Rules](https://console.firebase.google.com/project/gate-checkin-app/firestore/rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write all documents
    // In production, you would restrict this further based on user roles
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 2. Storage Rules
[Go to Storage Rules](https://console.firebase.google.com/project/gate-checkin-app/storage/rules)

```javascript
rules_version = '2';
service lg.firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> [!NOTE]
> Since we now store photos as base64 in Firestore, the Storage rules are technically optional, but good to have if we ever re-enable cloud storage.
