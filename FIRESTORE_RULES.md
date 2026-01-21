# Firestore rules needed for Feedback page

Your feedback page writes to and reads from the **Firestore** collection named **`feedbacks`**.

If you see:
- `Error submitting feedback: Permission Denied ...`
- reviews never load / spinner stays

…then your Firestore security rules are blocking **create** and/or **read**.

## What to do (Firebase Console)
1. Open **Firebase Console** → your project → **Firestore Database** → **Rules**.
2. Replace your rules with the rules below (or merge the `feedbacks` block into your existing rules).
3. Click **Publish**.

## Recommended rules (users + feedbacks)
These rules support:
- cart/user profile sync in the site (`users/{uid}` docs)
- feedback submission + public review display (`feedbacks/*`)

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write ONLY their own user document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Feedbacks: anyone can READ (show reviews), only logged-in users can CREATE
    match /feedbacks/{feedbackId} {
      allow read: if true;

      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100
        && request.resource.data.message is string
        && request.resource.data.message.size() >= 3
        && request.resource.data.message.size() <= 1000
        && request.resource.data.rating is int
        && request.resource.data.rating >= 1
        && request.resource.data.rating <= 5
        && request.resource.data.timestamp is timestamp;

      // Lock down edits/deletes from the client
      allow update, delete: if false;
    }

    // Default: deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Optional tightening
If you want **only logged-in users** to see reviews, change:

```rules
allow read: if true;
```

to:

```rules
allow read: if request.auth != null;
```
