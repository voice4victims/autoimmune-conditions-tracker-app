import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin SDK configuration
let adminApp: any;

export const initializeFirebaseAdmin = () => {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
        try {
            // In production, use environment variables for service account
            const serviceAccount: ServiceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            };

            adminApp = initializeApp({
                credential: cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            });

            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase Admin:', error);
            throw error;
        }
    } else {
        adminApp = getApps()[0];
    }

    return adminApp;
};

// Initialize Firebase Admin services
export const getAdminFirestore = () => {
    if (!adminApp) initializeFirebaseAdmin();
    return getFirestore(adminApp);
};

export const getAdminAuth = () => {
    if (!adminApp) initializeFirebaseAdmin();
    return getAuth(adminApp);
};

export const getAdminStorage = () => {
    if (!adminApp) initializeFirebaseAdmin();
    return getStorage(adminApp);
};

// Admin utilities for user management
export class FirebaseAdminService {
    private static instance: FirebaseAdminService;
    private db: FirebaseFirestore.Firestore;
    private auth: any;
    private storage: any;

    private constructor() {
        initializeFirebaseAdmin();
        this.db = getAdminFirestore();
        this.auth = getAdminAuth();
        this.storage = getAdminStorage();
    }

    public static getInstance(): FirebaseAdminService {
        if (!FirebaseAdminService.instance) {
            FirebaseAdminService.instance = new FirebaseAdminService();
        }
        return FirebaseAdminService.instance;
    }

    // User Management
    async createUser(userData: {
        email: string;
        password: string;
        displayName?: string;
        disabled?: boolean;
    }) {
        try {
            const userRecord = await this.auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                disabled: userData.disabled || false,
            });

            // Create user document in Firestore
            await this.db.collection('users').doc(userRecord.uid).set({
                email: userData.email,
                displayName: userData.displayName,
                createdAt: new Date(),
                role: 'user',
                isActive: true,
            });

            return userRecord;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async updateUser(uid: string, updates: any) {
        try {
            const userRecord = await this.auth.updateUser(uid, updates);

            // Update user document in Firestore
            await this.db.collection('users').doc(uid).update({
                ...updates,
                updatedAt: new Date(),
            });

            return userRecord;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(uid: string) {
        try {
            // Delete user from Authentication
            await this.auth.deleteUser(uid);

            // Delete user document and related data
            await this.deleteUserData(uid);

            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    async getUserByEmail(email: string) {
        try {
            return await this.auth.getUserByEmail(email);
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    }

    async setCustomClaims(uid: string, claims: any) {
        try {
            await this.auth.setCustomUserClaims(uid, claims);
            return { success: true };
        } catch (error) {
            console.error('Error setting custom claims:', error);
            throw error;
        }
    }

    // Data Management
    async deleteUserData(uid: string) {
        try {
            const batch = this.db.batch();

            // Delete user document
            batch.delete(this.db.collection('users').doc(uid));

            // Delete children data
            const childrenSnapshot = await this.db
                .collection('children')
                .where('userId', '==', uid)
                .get();

            childrenSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete privacy settings
            batch.delete(this.db.collection('privacy_settings').doc(uid));

            // Delete family access records
            const familyAccessSnapshot = await this.db
                .collection('family_access')
                .where('ownerId', '==', uid)
                .get();

            familyAccessSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error deleting user data:', error);
            throw error;
        }
    }

    // Analytics and Reporting
    async getUserStats() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const childrenSnapshot = await this.db.collection('children').get();

            return {
                totalUsers: usersSnapshot.size,
                totalChildren: childrenSnapshot.size,
                timestamp: new Date(),
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Backup and Export
    async exportUserData(uid: string) {
        try {
            const userData: any = {};

            // Get user document
            const userDoc = await this.db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                userData.profile = userDoc.data();
            }

            // Get children data
            const childrenSnapshot = await this.db
                .collection('children')
                .where('userId', '==', uid)
                .get();

            userData.children = childrenSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Get privacy settings
            const privacyDoc = await this.db.collection('privacy_settings').doc(uid).get();
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

export default FirebaseAdminService;