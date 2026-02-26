# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., `pandastracker`)
4. Follow the prompts to create the project

## 2. Register a Web App

1. In the Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", click the web icon (`</>`)
3. Enter a nickname (e.g., "PANDAS Tracker Web")
4. Click **Register app**
5. Copy the `firebaseConfig` object — you'll need it for `src/lib/firebase.ts`
6. Click **Continue to console** (skip Firebase CLI and Hosting steps)

## 3. Update the App Config

Replace the config values in `src/lib/firebase.ts` with your own:

```ts
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

## 4. Enable Authentication

1. Go to **Build > Authentication > Get started**
2. Enable the following sign-in providers:
   - **Email/Password** — toggle on, save
   - **Google** — toggle on, set a public-facing project name and support email, save
   - **Anonymous** — toggle on, save

## 5. Create Firestore Database

1. Go to **Build > Firestore Database > Create database**
2. Select **Standard edition**
3. Choose a location close to your users (e.g., `nam5` for United States) — this cannot be changed later
4. Select **Start in test mode** (allows open read/write for 30 days)
5. Click **Create**

Note: Update security rules before the 30-day test mode expires.

## 6. Set Up Storage

1. Go to **Build > Storage > Get started**
2. Keep the default bucket settings
3. Select **Start in test mode**
4. Click **Done**

## 7. Enable Additional Sign-In Providers

### Apple

1. Go to **Build > Authentication > Sign-in method > Add new provider**
2. Select **Apple**
3. Toggle it on
4. You don't need to fill in the Services ID or OAuth code flow fields — leave them empty
5. Click **Save**

### Facebook

1. Go to **Build > Authentication > Sign-in method > Add new provider**
2. Select **Facebook**
3. You'll need a Facebook App ID and App Secret:
   - Go to [Facebook Developers](https://developers.facebook.com/) and create an app
   - Add the **Facebook Login** product
   - Copy the App ID and App Secret
4. Paste them in the Firebase form
5. Copy the **OAuth redirect URI** that Firebase shows you
6. Go back to your Facebook app settings and add that redirect URI under **Valid OAuth Redirect URIs**
7. Click **Save** in Firebase

## 8. Deploy Security Rules

The test mode rules expire after 30 days. Replace them with the project's security rules before that happens.

### Firestore Rules

1. Go to **Build > Firestore Database > Rules** tab
2. Select all the existing rules and delete them
3. Open the `firestore.rules` file from this project and copy the entire contents
4. Paste it into the rules editor
5. Click **Publish**

### Storage Rules

1. Go to **Build > Storage > Rules** tab
2. Select all the existing rules and delete them
3. Paste the following rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /shared/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /files/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. Click **Publish**

These rules enforce that users can only read and write their own data. Each document is tied to the authenticated user's ID, so no one can access another user's information.

## 9. Create Composite Indexes

Some queries require composite indexes. The easiest way to create them is to run the app, open the browser console, and click the index creation links that appear in error messages. The following indexes are needed:

- **user_sessions**: `isValid` (Asc), `userId` (Asc), `lastActivity` (Desc)
- **activity_logs**: `userId` (Asc), `child_id` (Asc), `date` (Desc), `created_at` (Desc)
- **food_diary**: `user_id` (Asc), `child_id` (Asc), `date` (Desc), `created_at` (Desc)

Indexes take a few minutes to build. You can check their status in **Firestore Database > Indexes**.

## 10. Verify

Run the app locally and test:
- Sign up with email/password
- Sign in with Google
- Sign in with Apple
- Create a child profile
- Upload a child photo
- Add food diary entries
- Add activity entries
- Check the browser console for errors — there should be none besides dev warnings
