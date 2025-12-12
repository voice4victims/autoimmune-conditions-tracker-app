import { User } from 'firebase/auth';
import { securePrivacyService } from './securePrivacyService';
import {
    familyService,
    fileService,
    medicalVisitService,
    medicationService,
    notesService,
    vitalSignsService,
    symptomService,
    recipeService,
    enhancedRecipeService,
    enhancedVitalSignsService,
    roleService,
    magicLinkService
} from './firebaseService';
import { Permission } from '@/types/privacy';
import { HIPAAComplianceService } from './hipaaCompliance';

/**
 * Privacy-Aware Data Service
 * 
 * This service wraps the existing Firebase service with privacy-aware access controls.
 * All data operations are filtered through privacy settings and role-based permissions.
 */
export class PrivacyAwareDataService {
    private static instance: PrivacyAwareDataService;

    public static getInstance(): PrivacyAwareDataService {
        if (!PrivacyAwareDataService.instance) {
            PrivacyAwareDataService.instance = new PrivacyAwareDataService();
        }
        return PrivacyAwareDataService.instance;
    }

    /**
     * Enhanced Family Service with Privacy Controls
     */
    family = {
        /**
         * Accept family invitation with privacy logging
         */
        acceptInvitation: async (inviteCode: string, userId: string, currentUser: User) => {
            try {
                const result = await familyService.acceptInvitation(inviteCode, userId);

                // Log the family access grant
                await HIPAAComplianceService.logAccess(
                    userId,
                    'grant_access',
                    'family_invitation',
                    inviteCode,
                    false,
                    currentUser.uid,
                    'Family invitation accepted'
                );

                return result;
            } catch (error) {
                await HIPAAComplianceService.logAccess(
                    userId,
                    'grant_access',
                    'family_invitation',
                    inviteCode,
                    true,
                    currentUser.uid,
                    `Failed to accept invitation: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
                throw error;
            }
        },

        /**
         * Get family members with privacy filtering
         */
        getFamilyMembers: async (userId: string, currentUser: User) => {
            // Check if user has permission to view family members
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'manage_access'
            );

            if (!hasPermission) {
                await HIPAAComplianceService.logAccess(
                    currentUser.uid,
                    'access_denied',
                    'family_members',
                    userId,
                    true,
                    undefined,
                    'Insufficient permissions to view family members'
                );
                throw new Error('Access denied: Cannot view family members');
            }

            const members = await familyService.getFamilyMembers(userId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'family_members',
                userId,
                false,
                undefined,
                `Retrieved ${members.length} family members`
            );

            return members;
        },

        /**
         * Revoke family access with privacy controls
         */
        revokeAccess: async (memberId: string, userId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot revoke family access');
            }

            await familyService.revokeAccess(memberId, userId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'revoke_access',
                'family_member',
                memberId,
                false,
                userId,
                'Family member access revoked'
            );
        }
    };

    /**
     * Enhanced File Service with Privacy Controls
     */
    files = {
        /**
         * Upload file with privacy checks
         */
        uploadFile: async (
            file: File,
            userId: string,
            childId: string,
            category: string,
            currentUser: User,
            description?: string
        ) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'upload_files',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot upload files for this child');
            }

            const fileId = await fileService.uploadFile(file, userId, childId, category, description);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'upload_file',
                'medical_file',
                fileId,
                false,
                childId,
                `Uploaded file: ${file.name} (${category})`
            );

            return fileId;
        },

        /**
         * Get files with privacy filtering
         */
        getFiles: async (userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_files',
                childId
            );

            if (!hasPermission) {
                return []; // Return empty array instead of throwing error for better UX
            }

            const files = await fileService.getFiles(userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'medical_files',
                childId,
                false,
                undefined,
                `Retrieved ${files.length} files`
            );

            return files;
        }
    };

    /**
     * Enhanced Medical Visit Service with Privacy Controls
     */
    medicalVisits = {
        /**
         * Add medical visit with privacy checks
         */
        addVisit: async (visitData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                visitData.user_id,
                'edit_treatments',
                visitData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot add medical visits for this child');
            }

            const visitId = await medicalVisitService.addVisit(visitData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'create_data',
                'medical_visit',
                visitId.id,
                false,
                visitData.child_id,
                `Added medical visit: ${visitData.provider_name}`
            );

            return visitId;
        },

        /**
         * Get medical visits with privacy filtering
         */
        getVisits: async (userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_treatments',
                childId
            );

            if (!hasPermission) {
                return [];
            }

            const visits = await medicalVisitService.getVisits(userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'medical_visits',
                childId,
                false,
                undefined,
                `Retrieved ${visits.length} medical visits`
            );

            return visits;
        }
    };

    /**
     * Enhanced Medication Service with Privacy Controls
     */
    medications = {
        /**
         * Add medication reminder with privacy checks
         */
        addReminder: async (reminderData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                reminderData.user_id,
                'edit_treatments',
                reminderData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot add medication reminders for this child');
            }

            const reminderId = await medicationService.addReminder(reminderData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'create_data',
                'medication_reminder',
                reminderId.id,
                false,
                reminderData.child_id,
                `Added medication reminder: ${reminderData.medication_name}`
            );

            return reminderId;
        },

        /**
         * Update medication reminder with privacy checks
         */
        updateReminder: async (reminderId: string, reminderData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                reminderData.user_id,
                'edit_treatments',
                reminderData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot update medication reminders for this child');
            }

            await medicationService.updateReminder(reminderId, reminderData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'edit_data',
                'medication_reminder',
                reminderId,
                false,
                reminderData.child_id,
                `Updated medication reminder: ${reminderData.medication_name}`
            );
        },

        /**
         * Get medication reminders with privacy filtering
         */
        getReminders: async (userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_treatments',
                childId
            );

            if (!hasPermission) {
                return [];
            }

            const reminders = await medicationService.getReminders(userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'medication_reminders',
                childId,
                false,
                undefined,
                `Retrieved ${reminders.length} medication reminders`
            );

            return reminders;
        },

        /**
         * Delete medication reminder with privacy checks
         */
        deleteReminder: async (reminderId: string, userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'edit_treatments',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot delete medication reminders for this child');
            }

            await medicationService.deleteReminder(reminderId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'delete_data',
                'medication_reminder',
                reminderId,
                false,
                childId,
                'Deleted medication reminder'
            );
        }
    };

    /**
     * Enhanced Notes Service with Privacy Controls
     */
    notes = {
        /**
         * Add note with privacy checks
         */
        addNote: async (noteData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                noteData.user_id,
                'edit_notes',
                noteData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot add notes for this child');
            }

            const noteId = await notesService.addNote(noteData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'create_data',
                'note',
                noteId.id,
                false,
                noteData.child_id,
                'Added note'
            );

            return noteId;
        },

        /**
         * Update note with privacy checks
         */
        updateNote: async (noteId: string, noteData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                noteData.user_id,
                'edit_notes',
                noteData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot update notes for this child');
            }

            await notesService.updateNote(noteId, noteData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'edit_data',
                'note',
                noteId,
                false,
                noteData.child_id,
                'Updated note'
            );
        },

        /**
         * Get notes with privacy filtering
         */
        getNotes: async (userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_notes',
                childId
            );

            if (!hasPermission) {
                return [];
            }

            const notes = await notesService.getNotes(userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'notes',
                childId,
                false,
                undefined,
                `Retrieved ${notes.length} notes`
            );

            return notes;
        },

        /**
         * Delete note with privacy checks
         */
        deleteNote: async (noteId: string, userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'edit_notes',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot delete notes for this child');
            }

            await notesService.deleteNote(noteId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'delete_data',
                'note',
                noteId,
                false,
                childId,
                'Deleted note'
            );
        }
    };

    /**
     * Enhanced Vital Signs Service with Privacy Controls
     */
    vitals = {
        /**
         * Add vital signs with privacy checks
         */
        addVitalSigns: async (vitalData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                vitalData.user_id,
                'edit_vitals',
                vitalData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot add vital signs for this child');
            }

            const vitalId = await vitalSignsService.addVitalSigns(vitalData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'create_data',
                'vital_signs',
                vitalId.id,
                false,
                vitalData.child_id,
                'Added vital signs'
            );

            return vitalId;
        },

        /**
         * Get vital signs with privacy filtering
         */
        getVitalSigns: async (userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_vitals',
                childId
            );

            if (!hasPermission) {
                return [];
            }

            const vitals = await vitalSignsService.getVitalSigns(userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'vital_signs',
                childId,
                false,
                undefined,
                `Retrieved ${vitals.length} vital sign records`
            );

            return vitals;
        },

        /**
         * Delete vital signs with privacy checks
         */
        deleteVitalSigns: async (vitalId: string, userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'edit_vitals',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot delete vital signs for this child');
            }

            await enhancedVitalSignsService.deleteVitalSigns(vitalId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'delete_data',
                'vital_signs',
                vitalId,
                false,
                childId,
                'Deleted vital signs'
            );
        }
    };

    /**
     * Enhanced Symptoms Service with Privacy Controls
     */
    symptoms = {
        /**
         * Get symptoms with privacy filtering
         */
        getSymptoms: async (
            userId: string,
            childId: string,
            currentUser: User,
            startDate?: Date,
            endDate?: Date
        ) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_symptoms',
                childId
            );

            if (!hasPermission) {
                return [];
            }

            const symptoms = await symptomService.getSymptoms(userId, childId, startDate, endDate);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'symptoms',
                childId,
                false,
                undefined,
                `Retrieved ${symptoms.length} symptom records${startDate && endDate ? ` for date range ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}` : ''}`
            );

            return symptoms;
        }
    };

    /**
     * Enhanced Recipe Service with Privacy Controls
     */
    recipes = {
        /**
         * Get recipes with privacy filtering
         */
        getRecipes: async (userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'view_treatments',
                childId
            );

            if (!hasPermission) {
                return [];
            }

            const recipes = await recipeService.getRecipes(userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'recipes',
                childId,
                false,
                undefined,
                `Retrieved ${recipes.length} recipes`
            );

            return recipes;
        },

        /**
         * Add recipe with privacy checks
         */
        addRecipe: async (recipeData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                recipeData.user_id,
                'edit_treatments',
                recipeData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot add recipes for this child');
            }

            const recipeId = await enhancedRecipeService.addRecipe(recipeData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'create_data',
                'recipe',
                recipeId.id,
                false,
                recipeData.child_id,
                `Added recipe: ${recipeData.name}`
            );

            return recipeId;
        },

        /**
         * Update recipe with privacy checks
         */
        updateRecipe: async (recipeId: string, recipeData: any, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                recipeData.user_id,
                'edit_treatments',
                recipeData.child_id
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot update recipes for this child');
            }

            await enhancedRecipeService.updateRecipe(recipeId, recipeData);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'edit_data',
                'recipe',
                recipeId,
                false,
                recipeData.child_id,
                `Updated recipe: ${recipeData.name}`
            );
        },

        /**
         * Delete recipe with privacy checks
         */
        deleteRecipe: async (recipeId: string, userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'edit_treatments',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot delete recipes for this child');
            }

            await enhancedRecipeService.deleteRecipe(recipeId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'delete_data',
                'recipe',
                recipeId,
                false,
                childId,
                'Deleted recipe'
            );
        }
    };

    /**
     * Enhanced Role Service with Privacy Controls
     */
    roles = {
        /**
         * Get user family access with privacy checks
         */
        getUserFamilyAccess: async (userId: string, familyId: string, currentUser: User) => {
            // Users can always check their own access
            if (currentUser.uid === userId) {
                return await roleService.getUserFamilyAccess(userId, familyId);
            }

            // Others need manage_access permission
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot view family access information');
            }

            return await roleService.getUserFamilyAccess(userId, familyId);
        },

        /**
         * Update user role with privacy checks
         */
        updateUserRole: async (accessId: string, newRole: string, familyId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot update user roles');
            }

            // Additional check: can the current user assign this specific role?
            const canAssignRole = await securePrivacyService.canAssignRole(
                currentUser,
                familyId,
                newRole as any
            );

            if (!canAssignRole) {
                throw new Error(`Access denied: Cannot assign role "${newRole}"`);
            }

            await roleService.updateUserRole(accessId, newRole);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'edit_data',
                'user_role',
                accessId,
                false,
                familyId,
                `Updated user role to: ${newRole}`
            );
        },

        /**
         * Get family members with roles and privacy filtering
         */
        getFamilyMembersWithRoles: async (familyId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot view family members');
            }

            const members = await roleService.getFamilyMembersWithRoles(familyId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'family_roles',
                familyId,
                false,
                undefined,
                `Retrieved ${members.length} family members with roles`
            );

            return members;
        },

        /**
         * Deactivate user access with privacy checks
         */
        deactivateUserAccess: async (accessId: string, familyId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot deactivate user access');
            }

            await roleService.deactivateUserAccess(accessId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'revoke_access',
                'family_member',
                accessId,
                false,
                familyId,
                'Deactivated family member access'
            );
        }
    };

    /**
     * Enhanced Magic Link Service with Privacy Controls
     */
    magicLinks = {
        /**
         * Create magic link with privacy checks
         */
        createMagicLink: async (config: any, userId: string, childId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'manage_access',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot create magic links for this child');
            }

            const magicLink = await magicLinkService.createMagicLink(config, userId, childId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'grant_access',
                'magic_link',
                magicLink.id,
                false,
                childId,
                `Created magic link for provider: ${config.provider_name}`
            );

            return magicLink;
        },

        /**
         * Get family magic links with privacy filtering
         */
        getFamilyMagicLinks: async (familyId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                return [];
            }

            const links = await magicLinkService.getFamilyMagicLinks(familyId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'magic_links',
                familyId,
                false,
                undefined,
                `Retrieved ${links.length} magic links`
            );

            return links;
        },

        /**
         * Deactivate magic link with privacy checks
         */
        deactivateMagicLink: async (linkId: string, familyId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot deactivate magic links');
            }

            await magicLinkService.deactivateMagicLink(linkId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'revoke_access',
                'magic_link',
                linkId,
                false,
                familyId,
                'Deactivated magic link'
            );
        },

        /**
         * Get magic link access logs with privacy checks
         */
        getMagicLinkAccessLogs: async (linkId: string, familyId: string, currentUser: User) => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                familyId,
                'manage_access'
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot view magic link access logs');
            }

            const logs = await magicLinkService.getMagicLinkAccessLogs(linkId);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'access_logs',
                linkId,
                false,
                familyId,
                `Retrieved ${logs.length} access log entries`
            );

            return logs;
        }
    };

    /**
     * Bulk data operations with privacy filtering
     */
    bulk = {
        /**
         * Get all child data with privacy filtering
         */
        getChildData: async (userId: string, childId: string, currentUser: User) => {
            const data: any = {
                symptoms: [],
                treatments: [],
                vitals: [],
                notes: [],
                files: [],
                medicalVisits: [],
                medications: [],
                recipes: []
            };

            // Check permissions for each data type and load accordingly
            const permissions = await securePrivacyService.getEffectivePermissions(
                currentUser,
                userId,
                childId
            );

            if (permissions.includes('view_symptoms')) {
                data.symptoms = await this.symptoms.getSymptoms(userId, childId, currentUser);
            }

            if (permissions.includes('view_treatments')) {
                data.treatments = await this.medicalVisits.getVisits(userId, childId, currentUser);
                data.medications = await this.medications.getReminders(userId, childId, currentUser);
                data.recipes = await this.recipes.getRecipes(userId, childId, currentUser);
            }

            if (permissions.includes('view_vitals')) {
                data.vitals = await this.vitals.getVitalSigns(userId, childId, currentUser);
            }

            if (permissions.includes('view_notes')) {
                data.notes = await this.notes.getNotes(userId, childId, currentUser);
            }

            if (permissions.includes('view_files')) {
                data.files = await this.files.getFiles(userId, childId, currentUser);
            }

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'view_data',
                'bulk_child_data',
                childId,
                false,
                undefined,
                `Retrieved bulk data for child with permissions: ${permissions.join(', ')}`
            );

            return data;
        },

        /**
         * Export child data with privacy controls
         */
        exportChildData: async (userId: string, childId: string, currentUser: User, format: 'json' | 'csv' | 'pdf' = 'json') => {
            const hasPermission = await securePrivacyService.hasPermission(
                currentUser,
                userId,
                'export_data',
                childId
            );

            if (!hasPermission) {
                throw new Error('Access denied: Cannot export data for this child');
            }

            const data = await this.getChildData(userId, childId, currentUser);

            await HIPAAComplianceService.logAccess(
                currentUser.uid,
                'export_data',
                'child_data',
                childId,
                false,
                undefined,
                `Exported child data in ${format} format`
            );

            return data;
        }
    };
}

// Export singleton instance
export const privacyAwareDataService = PrivacyAwareDataService.getInstance();