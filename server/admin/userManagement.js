const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    // For local development, you can use a service account key file
    // For production, use environment variables

    let serviceAccount;

    if (process.env.NODE_ENV === 'production') {
        // Production: Use environment variables
        serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
        };
    } else {
        // Development: Use service account key file
        // Download from Firebase Console > Project Settings > Service Accounts
        try {
            serviceAccount = require('./serviceAccountKey.json');
        } catch (error) {
            console.error('Service account key not found. Please download from Firebase Console.');
            process.exit(1);
        }
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
}

const db = admin.firestore();
const auth = admin.auth();

class UserManagementService {
    // Create a new user
    async createUser(userData) {
        try {
            const userRecord = await auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                disabled: false
            });

            // Create user profile in Firestore
            await db.collection('users').doc(userRecord.uid).set({
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role || 'user',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                preferences: {
                    notifications: true,
                    dataSharing: false,
                    theme: 'light'
                }
            });

            console.log('Successfully created user:', userRecord.uid);
            return userRecord;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Update user information
    async updateUser(uid, updates) {
        try {
            // Update authentication record
            const userRecord = await auth.updateUser(uid, updates);

            // Update Firestore document
            await db.collection('users').doc(uid).update({
                ...updates,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('Successfully updated user:', uid);
            return userRecord;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Delete user and all associated data
    async deleteUser(uid) {
        try {
            // Delete from Authentication
            await auth.deleteUser(uid);

            // Delete user data from Firestore
            await this.deleteUserData(uid);

            console.log('Successfully deleted user:', uid);
            return { success: true, uid };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Delete all user data from Firestore
    async deleteUserData(uid) {
        const batch = db.batch();

        try {
            // Delete user profile
            batch.delete(db.collection('users').doc(uid));

            // Delete children profiles
            const childrenSnapshot = await db.collection('children')
                .where('userId', '==', uid)
                .get();

            childrenSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Delete privacy settings
            batch.delete(db.collection('privacy_settings').doc(uid));

            // Delete family access records
            const familyAccessSnapshot = await db.collection('family_access')
                .where('ownerId', '==', uid)
                .get();

            familyAccessSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log('Successfully deleted user data for:', uid);
        } catch (error) {
            console.error('Error deleting user data:', error);
            throw error;
        }
    }

    // Set custom claims for role-based access
    async setUserRole(uid, role) {
        try {
            await auth.setCustomUserClaims(uid, { role });

            // Update role in Firestore
            await db.collection('users').doc(uid).update({
                role,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('Successfully set role for user:', uid, 'Role:', role);
            return { success: true, uid, role };
        } catch (error) {
            console.error('Error setting user role:', error);
            throw error;
        }
    }

    // Get user by email
    async getUserByEmail(email) {
        try {
            const userRecord = await auth.getUserByEmail(email);
            const userDoc = await db.collection('users').doc(userRecord.uid).get();

            return {
                ...userRecord,
                firestoreData: userDoc.exists ? userDoc.data() : null
            };
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    }

    // List all users with pagination
    async listUsers(maxResults = 1000, pageToken = null) {
        try {
            const listUsersResult = await auth.listUsers(maxResults, pageToken);

            // Get additional user data from Firestore
            const usersWithData = await Promise.all(
                listUsersResult.users.map(async (userRecord) => {
                    const userDoc = await db.collection('users').doc(userRecord.uid).get();
                    return {
                        ...userRecord,
                        firestoreData: userDoc.exists ? userDoc.data() : null
                    };
                })
            );

            return {
                users: usersWithData,
                pageToken: listUsersResult.pageToken
            };
        } catch (error) {
            console.error('Error listing users:', error);
            throw error;
        }
    }

    // Generate user statistics
    async getUserStatistics() {
        try {
            const usersSnapshot = await db.collection('users').get();
            const childrenSnapshot = await db.collection('children').get();

            const stats = {
                totalUsers: usersSnapshot.size,
                totalChildren: childrenSnapshot.size,
                activeUsers: 0,
                usersByRole: {},
                timestamp: new Date()
            };

            usersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.isActive) stats.activeUsers++;

                const role = userData.role || 'user';
                stats.usersByRole[role] = (stats.usersByRole[role] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error generating user statistics:', error);
            throw error;
        }
    }

    // Export user data (for GDPR compliance)
    async exportUserData(uid) {
        try {
            const userData = {};

            // Get user profile
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                userData.profile = userDoc.data();
            }

            // Get children data
            const childrenSnapshot = await db.collection('children')
                .where('userId', '==', uid)
                .get();

            userData.children = childrenSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Get privacy settings
            const privacyDoc = await db.collection('privacy_settings').doc(uid).get();
            if (privacyDoc.exists) {
                userData.privacySettings = privacyDoc.data();
            }

            return userData;
        } catch (error) {
            console.error('Error exporting user data:', error);
            throw error;
        }
    }
}

module.exports = new UserManagementService();