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

## 7. Verify

Run the app locally and test sign-up/login to confirm everything is connected.
