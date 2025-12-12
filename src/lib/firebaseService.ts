import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    Timestamp
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';

// Family Access Management
export const familyService = {
    // Accept family invitation
    async acceptInvitation(inviteCode: string, userId: string) {
        const invitationsRef = collection(db, 'family_invitations');
        const q = query(
            invitationsRef,
            where('invitation_code', '==', inviteCode),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            throw new Error('Invalid or expired invitation code');
        }

        const invitation = snapshot.docs[0];
        const invitationData = invitation.data();

        // Check if invitation is expired
        if (invitationData.expires_at.toDate() < new Date()) {
            throw new Error('Invitation has expired');
        }

        // Add user to family access
        await addDoc(collection(db, 'family_access'), {
            family_id: invitationData.family_id,
            user_id: userId,
            role: invitationData.role || 'parent', // Use role from invitation or default to parent
            invited_by: invitationData.invited_by,
            accepted_at: Timestamp.now(),
            is_active: true
        });

        // Update invitation status
        await updateDoc(invitation.ref, {
            status: 'accepted',
            accepted_at: Timestamp.now()
        });
    },

    // Get family members
    async getFamilyMembers(userId: string) {
        const accessRef = collection(db, 'family_access');
        const q = query(accessRef, where('owner_user_id', '==', userId));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    // Revoke family access
    async revokeAccess(memberId: string, userId: string) {
        const memberRef = doc(db, 'family_access', memberId);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists() || memberDoc.data().owner_user_id !== userId) {
            throw new Error('Unauthorized');
        }

        await deleteDoc(memberRef);
    }
};

// File Management
export const fileService = {
    // Upload file
    async uploadFile(file: File, userId: string, childId: string, category: string, description?: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `files/${userId}/${childId}/${fileName}`;

        // Upload to Firebase Storage
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        // Save metadata to Firestore
        const fileDoc = await addDoc(collection(db, 'file_uploads'), {
            user_id: userId,
            child_id: childId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            download_url: downloadURL,
            category,
            description: description || '',
            created_at: Timestamp.now()
        });

        return fileDoc.id;
    },

    // Get files for child
    async getFiles(userId: string, childId: string) {
        const filesRef = collection(db, 'file_uploads');
        const q = query(
            filesRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Medical Visits
export const medicalVisitService = {
    // Add medical visit
    async addVisit(visitData: any) {
        return await addDoc(collection(db, 'medical_visits'), {
            ...visitData,
            created_at: Timestamp.now()
        });
    },

    // Get medical visits
    async getVisits(userId: string, childId: string) {
        const visitsRef = collection(db, 'medical_visits');
        const q = query(
            visitsRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId),
            orderBy('visit_date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Medication Reminders
export const medicationService = {
    // Add reminder
    async addReminder(reminderData: any) {
        return await addDoc(collection(db, 'medication_reminders'), {
            ...reminderData,
            created_at: Timestamp.now()
        });
    },

    // Update reminder
    async updateReminder(reminderId: string, reminderData: any) {
        const reminderRef = doc(db, 'medication_reminders', reminderId);
        await updateDoc(reminderRef, {
            ...reminderData,
            updated_at: Timestamp.now()
        });
    },

    // Get reminders
    async getReminders(userId: string, childId: string) {
        const remindersRef = collection(db, 'medication_reminders');
        const q = query(
            remindersRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    // Delete reminder
    async deleteReminder(reminderId: string) {
        const reminderRef = doc(db, 'medication_reminders', reminderId);
        await deleteDoc(reminderRef);
    }
};

// Notes
export const notesService = {
    // Add note
    async addNote(noteData: any) {
        return await addDoc(collection(db, 'notes'), {
            ...noteData,
            created_at: Timestamp.now()
        });
    },

    // Update note
    async updateNote(noteId: string, noteData: any) {
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, {
            ...noteData,
            updated_at: Timestamp.now()
        });
    },

    // Get notes
    async getNotes(userId: string, childId: string) {
        const notesRef = collection(db, 'notes');
        const q = query(
            notesRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    // Delete note
    async deleteNote(noteId: string) {
        const noteRef = doc(db, 'notes', noteId);
        await deleteDoc(noteRef);
    }
};

// Vital Signs
export const vitalSignsService = {
    // Add vital signs
    async addVitalSigns(vitalData: any) {
        return await addDoc(collection(db, 'vital_signs'), {
            ...vitalData,
            created_at: Timestamp.now()
        });
    },

    // Get vital signs
    async getVitalSigns(userId: string, childId: string) {
        const vitalsRef = collection(db, 'vital_signs');
        const q = query(
            vitalsRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Symptoms
export const symptomService = {
    // Get symptoms for heatmap
    async getSymptoms(userId: string, childId: string, startDate?: Date, endDate?: Date) {
        const symptomsRef = collection(db, 'symptoms');
        let q = query(
            symptomsRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId)
        );

        if (startDate && endDate) {
            q = query(q,
                where('date', '>=', Timestamp.fromDate(startDate)),
                where('date', '<=', Timestamp.fromDate(endDate))
            );
        }

        q = query(q, orderBy('date', 'desc'));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Recipes
export const recipeService = {
    // Get recipes
    async getRecipes(userId: string, childId: string) {
        const recipesRef = collection(db, 'recipes');
        const q = query(
            recipesRef,
            where('user_id', '==', userId),
            where('child_id', '==', childId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Enhanced Recipe Service
export const enhancedRecipeService = {
    // Add recipe
    async addRecipe(recipeData: any) {
        return await addDoc(collection(db, 'supplement_recipes'), {
            ...recipeData,
            created_at: Timestamp.now()
        });
    },

    // Update recipe
    async updateRecipe(recipeId: string, recipeData: any) {
        const recipeRef = doc(db, 'supplement_recipes', recipeId);
        await updateDoc(recipeRef, {
            ...recipeData,
            updated_at: Timestamp.now()
        });
    },

    // Delete recipe
    async deleteRecipe(recipeId: string) {
        const recipeRef = doc(db, 'supplement_recipes', recipeId);
        await deleteDoc(recipeRef);
    }
};
// Enhanced Vital Signs Service
export const enhancedVitalSignsService = {
    // Delete vital signs
    async deleteVitalSigns(vitalId: string) {
        const vitalRef = doc(db, 'vital_signs', vitalId);
        await deleteDoc(vitalRef);
    }
};
// Role and Permission Management
export const roleService = {
    // Get user's family access for a specific family
    async getUserFamilyAccess(userId: string, familyId: string) {
        const accessRef = collection(db, 'family_access');
        const q = query(
            accessRef,
            where('user_id', '==', userId),
            where('family_id', '==', familyId),
            where('is_active', '==', true)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    },

    // Update user role in family
    async updateUserRole(accessId: string, newRole: string) {
        const accessRef = doc(db, 'family_access', accessId);
        await updateDoc(accessRef, {
            role: newRole,
            updated_at: Timestamp.now()
        });
    },

    // Get all family members with their roles
    async getFamilyMembersWithRoles(familyId: string) {
        const accessRef = collection(db, 'family_access');
        const q = query(
            accessRef,
            where('family_id', '==', familyId),
            where('is_active', '==', true),
            orderBy('accepted_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    // Deactivate user access (soft delete)
    async deactivateUserAccess(accessId: string) {
        const accessRef = doc(db, 'family_access', accessId);
        await updateDoc(accessRef, {
            is_active: false,
            deactivated_at: Timestamp.now()
        });
    }
};
// Magic Link Service for Medical Providers
export const magicLinkService = {
    // Generate a secure magic link
    async createMagicLink(config: any, userId: string, childId: string) {
        const accessToken = this.generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + config.expires_in_hours);

        const magicLinkData = {
            family_id: userId,
            child_id: childId,
            created_by: userId,
            provider_name: config.provider_name,
            provider_email: config.provider_email || null,
            access_token: accessToken,
            expires_at: Timestamp.fromDate(expiresAt),
            permissions: config.permissions,
            is_active: true,
            access_count: 0,
            max_access_count: config.max_access_count || null,
            notes: config.notes || '',
            created_at: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'magic_links'), magicLinkData);
        return {
            id: docRef.id,
            access_token: accessToken,
            expires_at: expiresAt,
            ...magicLinkData
        };
    },

    // Generate cryptographically secure token
    generateSecureToken(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Validate and get magic link data
    async validateMagicLink(token: string) {
        const linksRef = collection(db, 'magic_links');
        const q = query(
            linksRef,
            where('access_token', '==', token),
            where('is_active', '==', true)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            throw new Error('Invalid or expired magic link');
        }

        const linkDoc = snapshot.docs[0];
        const linkData = linkDoc.data();

        // Check if expired
        if (linkData.expires_at.toDate() < new Date()) {
            throw new Error('Magic link has expired');
        }

        // Check access count limit
        if (linkData.max_access_count && linkData.access_count >= linkData.max_access_count) {
            throw new Error('Magic link access limit exceeded');
        }

        return {
            id: linkDoc.id,
            ...linkData
        };
    },

    // Record access attempt
    async recordAccess(linkId: string, accessInfo: any = {}) {
        // Update access count and last accessed time
        const linkRef = doc(db, 'magic_links', linkId);
        await updateDoc(linkRef, {
            access_count: increment(1),
            last_accessed: Timestamp.now()
        });

        // Record detailed access log
        await addDoc(collection(db, 'magic_link_access'), {
            magic_link_id: linkId,
            accessed_at: Timestamp.now(),
            ip_address: accessInfo.ip_address || null,
            user_agent: accessInfo.user_agent || null,
            provider_info: accessInfo.provider_info || null
        });
    },

    // Get child data based on magic link permissions
    async getChildDataForProvider(linkId: string, permissions: string[]) {
        const linkData = await this.validateMagicLink(linkId);
        const childId = linkData.child_id;
        const familyId = linkData.family_id;

        const data: any = {
            child_profile: null,
            symptoms: [],
            treatments: [],
            vitals: [],
            notes: [],
            files: [],
            analytics: null
        };

        // Get child profile (basic info only)
        const childRef = doc(db, 'children', childId);
        const childDoc = await getDoc(childRef);
        if (childDoc.exists()) {
            const childData = childDoc.data();
            data.child_profile = {
                name: childData.name,
                age: childData.age,
                diagnosis: childData.diagnosis,
                created_at: childData.created_at
            };
        }

        // Get data based on permissions
        if (permissions.includes('view_symptoms')) {
            const symptomsRef = collection(db, 'children', childId, 'symptoms');
            const symptomsQuery = query(symptomsRef, orderBy('date', 'desc'), limit(100));
            const symptomsSnapshot = await getDocs(symptomsQuery);
            data.symptoms = symptomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (permissions.includes('view_treatments')) {
            const treatmentsRef = collection(db, 'children', childId, 'treatments');
            const treatmentsQuery = query(treatmentsRef, orderBy('administration_date', 'desc'), limit(50));
            const treatmentsSnapshot = await getDocs(treatmentsQuery);
            data.treatments = treatmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (permissions.includes('view_vitals')) {
            const vitalsRef = collection(db, 'vital_signs');
            const vitalsQuery = query(
                vitalsRef,
                where('child_id', '==', childId),
                orderBy('date', 'desc'),
                limit(50)
            );
            const vitalsSnapshot = await getDocs(vitalsQuery);
            data.vitals = vitalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (permissions.includes('view_notes')) {
            const notesRef = collection(db, 'children', childId, 'notes');
            const notesQuery = query(notesRef, orderBy('date', 'desc'), limit(50));
            const notesSnapshot = await getDocs(notesQuery);
            data.notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (permissions.includes('view_files')) {
            const filesRef = collection(db, 'file_uploads');
            const filesQuery = query(
                filesRef,
                where('child_id', '==', childId),
                orderBy('created_at', 'desc'),
                limit(20)
            );
            const filesSnapshot = await getDocs(filesQuery);
            data.files = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        return data;
    },

    // Get all magic links for a family
    async getFamilyMagicLinks(familyId: string) {
        const linksRef = collection(db, 'magic_links');
        const q = query(
            linksRef,
            where('family_id', '==', familyId),
            orderBy('created_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    // Deactivate magic link
    async deactivateMagicLink(linkId: string) {
        const linkRef = doc(db, 'magic_links', linkId);
        await updateDoc(linkRef, {
            is_active: false,
            deactivated_at: Timestamp.now()
        });
    },

    // Get access logs for a magic link
    async getMagicLinkAccessLogs(linkId: string) {
        const logsRef = collection(db, 'magic_link_access');
        const q = query(
            logsRef,
            where('magic_link_id', '==', linkId),
            orderBy('accessed_at', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};