import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChildProfile, SymptomRating } from '@/types/pandas';
import { useAuth } from './AuthContext';
import { useEnhancedPermissions } from '@/hooks/useEnhancedPermissions';
import { privacyAwareDataService } from '@/lib/privacyAwareDataService';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    orderBy,
} from 'firebase/firestore';

interface Treatment {
    id: string;
    treatment_type: string;
    medication_name: string;
    dosage: string;
    administration_date: string;
    administration_time: string;
    symptoms_improved: boolean;
    improvement_notes?: string;
    created_at: string | Timestamp;
}

interface Note {
    id: string;
    note: string;
    date: string;
    created_at: string | Timestamp;
}

interface EnhancedAppContextType {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    childProfile: ChildProfile | null;
    setChildProfile: (profile: ChildProfile | null) => void;
    children: ChildProfile[];
    treatments: Treatment[];
    symptoms: SymptomRating[];
    notes: Note[];
    customSymptoms: string[];

    // Enhanced methods with privacy controls
    addSymptom: (symptom: SymptomRating) => Promise<void>;
    addTreatment: (treatment: any) => Promise<void>;
    addNote: (note: Pick<Note, 'note' | 'date'>) => Promise<void>;
    addCustomSymptom: (symptom: string) => void;
    loadChildren: () => Promise<void>;
    loadTreatments: () => Promise<void>;
    loadSymptoms: () => Promise<void>;
    loadNotes: () => Promise<void>;
    saveChildProfile: (profile: Partial<ChildProfile>) => Promise<void>;
    deleteChild: (childId: string) => Promise<void>;

    // Privacy-aware data loading
    loadChildDataWithPermissions: (childId: string) => Promise<void>;
    canAccessChildData: (childId: string, dataType: string, action?: 'view' | 'edit' | 'delete') => Promise<boolean>;
    getFilteredChildren: () => Promise<ChildProfile[]>;

    // Permission context
    permissionContext: any;
    loading: boolean;
    error: string | null;
}

const EnhancedAppContext = createContext<EnhancedAppContextType>({} as EnhancedAppContextType);

export const useEnhancedApp = () => useContext(EnhancedAppContext);

export const EnhancedAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
    const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [symptoms, setSymptoms] = useState<SymptomRating[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [customSymptoms, setCustomSymptoms] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const permissionContext = useEnhancedPermissions();

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    const addCustomSymptom = (symptom: string) => {
        if (!customSymptoms.includes(symptom)) {
            setCustomSymptoms((prev) => [...prev, symptom]);
        }
    };

    /**
     * Check if user can access specific child data
     */
    const canAccessChildData = useCallback(async (
        childId: string,
        dataType: string,
        action: 'view' | 'edit' | 'delete' = 'view'
    ): Promise<boolean> => {
        if (!user || !childProfile) return false;

        try {
            return await permissionContext.canAccessData(dataType, childId, action);
        } catch (error) {
            console.error('Error checking child data access:', error);
            return false;
        }
    }, [user, childProfile, permissionContext]);

    /**
     * Get filtered children based on user permissions
     */
    const getFilteredChildren = useCallback(async (): Promise<ChildProfile[]> => {
        if (!user) return [];

        try {
            // Load all children the user owns
            const q = query(collection(db, 'children'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const ownedChildren = querySnapshot.docs.map(
                (doc) => ({ id: doc.id, ...doc.data() } as ChildProfile)
            );

            // Filter children based on privacy permissions
            const accessibleChildren = [];
            for (const child of ownedChildren) {
                const canAccess = await canAccessChildData(child.id!, 'symptoms', 'view');
                if (canAccess) {
                    accessibleChildren.push(child);
                }
            }

            return accessibleChildren;
        } catch (error) {
            console.error('Error filtering children:', error);
            return [];
        }
    }, [user, canAccessChildData]);

    /**
     * Load children with privacy filtering
     */
    const loadChildren = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const filteredChildren = await getFilteredChildren();
            setChildrenList(filteredChildren);

            if (filteredChildren.length > 0 && !childProfile) {
                setChildProfile(filteredChildren[0]);
            } else if (filteredChildren.length === 0) {
                setChildProfile(null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load children';
            setError(errorMessage);
            console.error('Error loading children:', err);
        } finally {
            setLoading(false);
        }
    }, [user, childProfile, getFilteredChildren]);

    /**
     * Save child profile with privacy controls
     */
    const saveChildProfile = useCallback(async (profile: Partial<ChildProfile>) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            if (profile.id) {
                // Check if user can edit this child's profile
                const canEdit = await canAccessChildData(profile.id, 'profile', 'edit');
                if (!canEdit) {
                    throw new Error('Access denied: Cannot edit this child profile');
                }

                const childRef = doc(db, 'children', profile.id);
                await updateDoc(childRef, profile);
            } else {
                // Creating new child - user always has permission for their own children
                await addDoc(collection(db, 'children'), {
                    ...profile,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
            }

            await loadChildren();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save child profile';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, canAccessChildData, loadChildren]);

    /**
     * Delete child with privacy controls
     */
    const deleteChild = useCallback(async (childId: string) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const canDelete = await canAccessChildData(childId, 'profile', 'delete');
            if (!canDelete) {
                throw new Error('Access denied: Cannot delete this child profile');
            }

            await deleteDoc(doc(db, 'children', childId));
            await loadChildren();

            const remainingChildren = childrenList.filter((child) => child.id !== childId);
            if (childProfile?.id === childId) {
                setChildProfile(remainingChildren.length > 0 ? remainingChildren[0] : null);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete child';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, canAccessChildData, loadChildren, childrenList, childProfile]);

    /**
     * Add symptom with privacy controls
     */
    const addSymptom = useCallback(async (symptom: SymptomRating) => {
        if (!childProfile || !childProfile.id || !user) return;

        setLoading(true);
        setError(null);

        try {
            const canAdd = await canAccessChildData(childProfile.id, 'symptoms', 'edit');
            if (!canAdd) {
                throw new Error('Access denied: Cannot add symptoms for this child');
            }

            await addDoc(collection(db, 'children', childProfile.id, 'symptoms'), {
                ...symptom,
                createdAt: serverTimestamp(),
            });

            await loadSymptoms();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add symptom';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [childProfile, user, canAccessChildData]);

    /**
     * Load symptoms with privacy filtering
     */
    const loadSymptoms = useCallback(async () => {
        if (!childProfile || !childProfile.id || !user) {
            setSymptoms([]);
            return;
        }

        try {
            const canView = await canAccessChildData(childProfile.id, 'symptoms', 'view');
            if (!canView) {
                setSymptoms([]);
                return;
            }

            const loadedSymptoms = await privacyAwareDataService.symptoms.getSymptoms(
                childProfile.userId,
                childProfile.id,
                user
            );

            setSymptoms(loadedSymptoms as SymptomRating[]);
        } catch (err) {
            console.error('Error loading symptoms:', err);
            setSymptoms([]);
        }
    }, [childProfile, user, canAccessChildData]);

    /**
     * Load treatments with privacy filtering
     */
    const loadTreatments = useCallback(async () => {
        if (!childProfile || !childProfile.id || !user) {
            setTreatments([]);
            return;
        }

        try {
            const canView = await canAccessChildData(childProfile.id, 'treatments', 'view');
            if (!canView) {
                setTreatments([]);
                return;
            }

            const q = query(
                collection(db, 'children', childProfile.id, 'treatments'),
                orderBy('administration_date', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const loadedTreatments = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as Treatment));

            setTreatments(loadedTreatments);
        } catch (err) {
            console.error('Error loading treatments:', err);
            setTreatments([]);
        }
    }, [childProfile, user, canAccessChildData]);

    /**
     * Add treatment with privacy controls
     */
    const addTreatment = useCallback(async (treatment: any) => {
        if (!childProfile || !childProfile.id || !user) return;

        setLoading(true);
        setError(null);

        try {
            const canAdd = await canAccessChildData(childProfile.id, 'treatments', 'edit');
            if (!canAdd) {
                throw new Error('Access denied: Cannot add treatments for this child');
            }

            const newTreatment = {
                ...treatment,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'children', childProfile.id, 'treatments'), newTreatment);
            await loadTreatments();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add treatment';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [childProfile, user, canAccessChildData, loadTreatments]);

    /**
     * Load notes with privacy filtering
     */
    const loadNotes = useCallback(async () => {
        if (!childProfile || !childProfile.id || !user) {
            setNotes([]);
            return;
        }

        try {
            const canView = await canAccessChildData(childProfile.id, 'notes', 'view');
            if (!canView) {
                setNotes([]);
                return;
            }

            const loadedNotes = await privacyAwareDataService.notes.getNotes(
                childProfile.userId,
                childProfile.id,
                user
            );

            setNotes(loadedNotes as Note[]);
        } catch (err) {
            console.error('Error loading notes:', err);
            setNotes([]);
        }
    }, [childProfile, user, canAccessChildData]);

    /**
     * Add note with privacy controls
     */
    const addNote = useCallback(async (note: Pick<Note, 'note' | 'date'>) => {
        if (!childProfile || !childProfile.id || !user) return;

        setLoading(true);
        setError(null);

        try {
            const canAdd = await canAccessChildData(childProfile.id, 'notes', 'edit');
            if (!canAdd) {
                throw new Error('Access denied: Cannot add notes for this child');
            }

            await privacyAwareDataService.notes.addNote({
                ...note,
                user_id: childProfile.userId,
                child_id: childProfile.id
            }, user);

            await loadNotes();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add note';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [childProfile, user, canAccessChildData, loadNotes]);

    /**
     * Load all child data with permissions
     */
    const loadChildDataWithPermissions = useCallback(async (childId: string) => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const bulkData = await privacyAwareDataService.bulk.getChildData(
                childProfile?.userId || user.uid,
                childId,
                user
            );

            // Update state with loaded data
            setSymptoms(bulkData.symptoms || []);
            setTreatments(bulkData.treatments || []);
            setNotes(bulkData.notes || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load child data';
            setError(errorMessage);
            console.error('Error loading child data:', err);
        } finally {
            setLoading(false);
        }
    }, [user, childProfile]);

    // Load children when user changes
    useEffect(() => {
        if (user) {
            loadChildren();
        }
    }, [user, loadChildren]);

    // Load child data when child profile changes
    useEffect(() => {
        if (childProfile) {
            loadTreatments();
            loadSymptoms();
            loadNotes();
        } else {
            setTreatments([]);
            setSymptoms([]);
            setNotes([]);
        }
    }, [childProfile, loadTreatments, loadSymptoms, loadNotes]);

    return (
        <EnhancedAppContext.Provider
            value={{
                sidebarOpen,
                toggleSidebar,
                childProfile,
                setChildProfile,
                children: childrenList,
                treatments,
                symptoms,
                notes,
                customSymptoms,
                addSymptom,
                addTreatment,
                addNote,
                addCustomSymptom,
                loadChildren,
                loadTreatments,
                loadSymptoms,
                loadNotes,
                saveChildProfile,
                deleteChild,
                loadChildDataWithPermissions,
                canAccessChildData,
                getFilteredChildren,
                permissionContext,
                loading,
                error,
            }}
        >
            {children}
        </EnhancedAppContext.Provider>
    );
};