# Firebase Admin SDK Setup

This directory contains Firebase Admin SDK configuration for server-side operations like user management, data administration, and analytics.

## Setup Instructions

### 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`pandas-tracker-production`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file and save it as `serviceAccountKey.json` in this directory

### 2. Environment Configuration

For production deployment, use environment variables instead of the service account file:

```bash
# Copy the admin environment template
cp .env.admin.example .env.admin

# Edit with your Firebase project credentials
nano .env.admin
```

### 3. Install Dependencies

```bash
npm install firebase-admin
```

## Usage Examples

### Command Line Interface

```bash
# Create a new user
npm run admin create-user admin@example.com password123 "Admin User" admin

# List all users
npm run admin list-users

# Get user statistics
npm run admin stats

# Set user role
npm run admin set-role <uid> moderator

# Export user data (GDPR compliance)
npm run admin export-data <uid>

# Delete user and all data
npm run admin delete-user <uid>
```

### Programmatic Usage

```javascript
const userManagement = require('./server/admin/userManagement');

// Create user
const user = await userManagement.createUser({
  email: 'user@example.com',
  password: 'securePassword',
  displayName: 'John Doe',
  role: 'user'
});

// Get user statistics
const stats = await userManagement.getUserStatistics();
console.log('Total users:', stats.totalUsers);

// Export user data
const userData = await userManagement.exportUserData(uid);
```

## Available Operations

### User Management
- ✅ Create users with email/password
- ✅ Update user information
- ✅ Delete users and associated data
- ✅ Set custom user roles and claims
- ✅ List users with pagination
- ✅ Search users by email

### Data Management
- ✅ Export user data (GDPR compliance)
- ✅ Delete all user-associated data
- ✅ Batch operations for data cleanup
- ✅ Generate user and usage statistics

### Security Features
- ✅ Role-based access control
- ✅ Custom claims for permissions
- ✅ Secure credential management
- ✅ Audit logging for admin operations

## Security Considerations

1. **Service Account Key**: Never commit `serviceAccountKey.json` to version control
2. **Environment Variables**: Use environment variables in production
3. **Access Control**: Limit admin access to authorized personnel only
4. **Audit Logging**: All admin operations are logged for security auditing
5. **Data Privacy**: Follow GDPR/HIPAA guidelines for user data handling

## File Structure

```
server/admin/
├── README.md                 # This file
├── userManagement.js         # Main admin service
├── serviceAccountKey.json    # Firebase service account (DO NOT COMMIT)
└── logs/                     # Admin operation logs
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `FIREBASE_PRIVATE_KEY` | Service account private key | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Service account email | ✅ |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |

## Troubleshooting

### Common Issues

**"Service account key not found"**
- Download the service account key from Firebase Console
- Place it in `server/admin/serviceAccountKey.json`

**"Permission denied"**
- Ensure the service account has the correct roles:
  - Firebase Admin SDK Administrator Service Agent
  - Cloud Datastore User

**"Project not found"**
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check that the service account belongs to the correct project

### Getting Help

1. Check Firebase Admin SDK documentation
2. Verify service account permissions in IAM console
3. Review Firebase project settings
4. Check environment variable configuration

## Production Deployment

For production environments:

1. Use environment variables instead of service account files
2. Set up proper IAM roles and permissions
3. Enable audit logging for compliance
4. Implement rate limiting for admin operations
5. Use secure credential management systems

```bash
# Production environment setup
export FIREBASE_PROJECT_ID="pandas-tracker-production"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@pandas-tracker-production.iam.gserviceaccount.com"
export NODE_ENV="production"
```