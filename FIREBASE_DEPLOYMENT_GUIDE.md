# 🚀 Firebase Deployment Guide - PANDAS Autoimmune Tracker

## Quick Start Deployment (15 minutes)

### Step 1: Create Firebase Project (5 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Create a project"

2. **Project Setup**
   - Project name: `pandas-autoimmune-tracker` (or your preferred name)
   - Enable Google Analytics: ✅ Yes (recommended)
   - Choose your Analytics account
   - Click "Create project"

3. **Enable Required Services**
   - In Firebase Console, enable these services:
     - **Authentication** → Sign-in method → Email/Password ✅
     - **Firestore Database** → Create database → Start in production mode
     - **Storage** → Get started
     - **Hosting** → Get started

### Step 2: Install Firebase CLI (2 minutes)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Step 3: Configure Your Project (3 minutes)

1. **Get Firebase Configuration**
   - In Firebase Console → Project Settings → General
   - Scroll to "Your apps" → Click "Web app" icon
   - Register app name: `PANDAS Tracker`
   - Copy the configuration object

2. **Create Environment File**
   ```bash
   # Copy the template
   cp .env.example .env.local
   ```

3. **Update .env.local with your Firebase config:**
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

### Step 4: Initialize Firebase in Your Project (2 minutes)

```bash
# Initialize Firebase
firebase init

# Select these services:
# ◉ Firestore: Configure security rules and indexes
# ◉ Storage: Configure security rules  
# ◉ Hosting: Configure files for Firebase Hosting

# Follow prompts:
# - Use existing project → Select your project
# - Firestore rules file: firestore.rules (default)
# - Firestore indexes file: firestore.indexes.json (default)
# - Storage rules file: storage.rules (default)
# - Public directory: dist
# - Single-page app: Yes
# - Set up automatic builds: No (for now)
```

### Step 5: Build and Deploy (3 minutes)

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## 🔒 Security Rules Setup

### Firestore Security Rules
Create/update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Children data - users can only access their own children
    match /children/{childId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Nested collections within children
      match /{collection}/{document} {
        allow read, write: if request.auth != null && 
          get(/databases/$(database)/documents/children/$(childId)).data.userId == request.auth.uid;
      }
    }
    
    // Privacy settings - users can only access their own
    match /privacy_settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family access - controlled sharing
    match /family_access/{accessId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || 
         request.auth.uid in resource.data.authorizedUsers);
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### Storage Security Rules
Create/update `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Shared files with family members
    match /shared/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌐 Custom Domain Setup (Optional)

1. **In Firebase Console:**
   - Go to Hosting → Add custom domain
   - Enter your domain name
   - Follow DNS configuration instructions

2. **DNS Configuration:**
   - Add A records or CNAME as instructed
   - Wait for SSL certificate provisioning (automatic)

## ✅ Post-Deployment Verification

### Test These Features:
1. **User Registration/Login** ✅
2. **Child Profile Creation** ✅
3. **Symptom Tracking** ✅
4. **Data Synchronization** ✅
5. **Privacy Settings** ✅
6. **Mobile Responsiveness** ✅

### Check Security:
```bash
# Test security rules
firebase emulators:start --only firestore,storage

# Run validation script
node scripts/validate-deployment.js
```

## 🚨 Troubleshooting

### Common Issues:

**Build Fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Firebase CLI Issues:**
```bash
# Update Firebase CLI
npm install -g firebase-tools@latest

# Re-login
firebase logout
firebase login
```

**Environment Variables Not Working:**
- Ensure `.env.local` is in project root
- Restart development server after changes
- Check variable names start with `VITE_`

**Deployment Fails:**
```bash
# Check Firebase project selection
firebase use --list
firebase use your-project-id

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## 📞 Support

If you encounter issues:
1. Check the [complete deployment guide](./PANDAS_TRACKER_GUIDE.md#technical-deployment-guide)
2. Review Firebase documentation
3. Check the troubleshooting section above

---

**🎉 Congratulations! Your PANDAS Autoimmune Tracker is now live!**

Your app will be available at: `https://your-project-id.web.app`