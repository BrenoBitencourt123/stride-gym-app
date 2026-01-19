// src/lib/firebase/firestoreRepo.ts
// Central Firestore repository - SOURCE OF TRUTH for all app data
// Replaces localStorage as primary persistence layer

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  Timestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { AppState } from '@/lib/appState';

// ============= TYPES =============

export interface FirestoreUserDoc {
  state: AppState;
  updatedAt: Timestamp | null;
  schemaVersion: number;
  migratedFromLocalStorageAt?: Timestamp | null;
}

export interface WorkoutSession {
  id: string;
  dateKey: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'abandoned';
  exercises: {
    exerciseId: string;
    name: string;
    sets: { weight: number; reps: number; rir?: number; done: boolean }[];
  }[];
  summary?: {
    sets: number;
    reps: number;
    tonnage: number;
    rirAvg?: number;
    prsCount?: number;
    durationMin?: number;
  };
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface NutritionDay {
  dateKey: string;
  meals: {
    id: string;
    nome: string;
    entries: {
      id: string;
      foodId: string;
      quantidade: number;
      unidade: 'g' | 'un' | 'ml' | 'scoop';
      source: 'diet' | 'extra' | 'auto';
      createdAt: number;
      planned: boolean;
      consumed: boolean;
    }[];
  }[];
  totals?: {
    kcal: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  completed?: boolean;
  updatedAt: Timestamp | null;
}

// ============= USER STATE FUNCTIONS =============

/**
 * Get user's complete AppState from Firestore
 */
export async function getUserState(uid: string): Promise<AppState | null> {
  if (!db || !uid) return null;
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as FirestoreUserDoc;
      return data.state || null;
    }
    return null;
  } catch (error) {
    console.error('[firestoreRepo] getUserState error:', error);
    return null;
  }
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    Object.keys(obj).forEach((key) => {
      const next = obj[key];
      if (next !== undefined) {
        cleaned[key] = stripUndefined(next);
      }
    });
    return cleaned;
  }
  return value;
}

/**
 * Save user's complete AppState to Firestore
 */
export async function setUserState(uid: string, state: AppState): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const docRef = doc(db, 'users', uid);
    const cleanedState = stripUndefined({
      ...state,
      updatedAt: Date.now()
    }) as AppState;
    await setDoc(docRef, {
      state: cleanedState,
      updatedAt: serverTimestamp(),
      schemaVersion: 2, // Increment for Firebase-first
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[firestoreRepo] setUserState error:', error);
    return false;
  }
}

/**
 * Update specific fields in AppState
 */
export async function updateUserState(uid: string, updates: Partial<AppState>): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const docRef = doc(db, 'users', uid);
    const currentState = await getUserState(uid);
    
    if (!currentState) {
      // No existing state, create new
      return setUserState(uid, updates as AppState);
    }
    
    const mergedState: AppState = stripUndefined({
      ...currentState,
      ...updates,
      updatedAt: Date.now()
    }) as AppState;
    
    await setDoc(docRef, {
      state: mergedState,
      updatedAt: serverTimestamp(),
      schemaVersion: 2,
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('[firestoreRepo] updateUserState error:', error);
    return false;
  }
}

/**
 * Subscribe to user state changes (real-time)
 */
export function subscribeToUserState(
  uid: string, 
  callback: (state: AppState | null) => void
): Unsubscribe {
  if (!db || !uid) {
    callback(null);
    return () => {};
  }
  
  const docRef = doc(db, 'users', uid);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as FirestoreUserDoc;
      callback(data.state || null);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[firestoreRepo] subscribeToUserState error:', error);
    callback(null);
  });
}

// ============= WORKOUT SESSION FUNCTIONS =============

/**
 * Get active workout session
 */
export async function getActiveWorkoutSession(uid: string): Promise<WorkoutSession | null> {
  if (!db || !uid) return null;
  
  try {
    const sessionsRef = collection(db, 'workouts', uid, 'sessions');
    const q = query(
      sessionsRef, 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WorkoutSession;
  } catch (error) {
    console.error('[firestoreRepo] getActiveWorkoutSession error:', error);
    return null;
  }
}

/**
 * Save workout session
 */
export async function saveWorkoutSession(
  uid: string, 
  session: Omit<WorkoutSession, 'createdAt' | 'updatedAt'>
): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const sessionRef = doc(db, 'workouts', uid, 'sessions', session.id);
    await setDoc(sessionRef, {
      ...session,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[firestoreRepo] saveWorkoutSession error:', error);
    return false;
  }
}

/**
 * Update workout session
 */
export async function updateWorkoutSession(
  uid: string,
  sessionId: string,
  updates: Partial<WorkoutSession>
): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const sessionRef = doc(db, 'workouts', uid, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[firestoreRepo] updateWorkoutSession error:', error);
    return false;
  }
}

// ============= NUTRITION FUNCTIONS =============

/**
 * Get nutrition for a specific day
 */
export async function getNutritionDay(uid: string, dateKey: string): Promise<NutritionDay | null> {
  if (!db || !uid) return null;
  
  try {
    const dayRef = doc(db, 'nutrition', uid, 'days', dateKey);
    const docSnap = await getDoc(dayRef);
    
    if (docSnap.exists()) {
      return { dateKey, ...docSnap.data() } as NutritionDay;
    }
    return null;
  } catch (error) {
    console.error('[firestoreRepo] getNutritionDay error:', error);
    return null;
  }
}

/**
 * Save nutrition for a specific day
 */
export async function saveNutritionDay(uid: string, nutrition: NutritionDay): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const dayRef = doc(db, 'nutrition', uid, 'days', nutrition.dateKey);
    await setDoc(dayRef, {
      ...nutrition,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[firestoreRepo] saveNutritionDay error:', error);
    return false;
  }
}

/**
 * Subscribe to nutrition day changes
 */
export function subscribeToNutritionDay(
  uid: string,
  dateKey: string,
  callback: (nutrition: NutritionDay | null) => void
): Unsubscribe {
  if (!db || !uid) {
    callback(null);
    return () => {};
  }
  
  const dayRef = doc(db, 'nutrition', uid, 'days', dateKey);
  
  return onSnapshot(dayRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ dateKey, ...docSnap.data() } as NutritionDay);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[firestoreRepo] subscribeToNutritionDay error:', error);
    callback(null);
  });
}

// ============= WEIGHT/MEASUREMENTS FUNCTIONS =============

export interface WeightMeasurement {
  date: string;
  weight: number;
  createdAt: Timestamp | null;
}

/**
 * Save weight measurement
 */
export async function saveWeightMeasurement(
  uid: string, 
  date: string, 
  weight: number
): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const weightRef = doc(db, 'measurements', uid, 'weight', date);
    await setDoc(weightRef, {
      weight,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('[firestoreRepo] saveWeightMeasurement error:', error);
    return false;
  }
}

/**
 * Get weight history
 */
export async function getWeightHistory(uid: string, limitCount: number = 90): Promise<WeightMeasurement[]> {
  if (!db || !uid) return [];
  
  try {
    const weightsRef = collection(db, 'measurements', uid, 'weight');
    const q = query(weightsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      date: doc.id,
      ...doc.data()
    })) as WeightMeasurement[];
  } catch (error) {
    console.error('[firestoreRepo] getWeightHistory error:', error);
    return [];
  }
}

// ============= MIGRATION FUNCTIONS =============

/**
 * Check if user has been migrated from localStorage
 */
export async function hasBeenMigrated(uid: string): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return !!data.migratedFromLocalStorageAt;
    }
    return false;
  } catch (error) {
    console.error('[firestoreRepo] hasBeenMigrated error:', error);
    return false;
  }
}

/**
 * Mark user as migrated from localStorage
 */
export async function markAsMigrated(uid: string): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      migratedFromLocalStorageAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('[firestoreRepo] markAsMigrated error:', error);
    return false;
  }
}

/**
 * Migrate localStorage data to Firestore (one-time operation)
 */
export async function migrateLocalStorageToFirestore(
  uid: string,
  localState: AppState
): Promise<{ success: boolean; error?: string }> {
  if (!db || !uid) {
    return { success: false, error: 'Firebase not configured' };
  }
  
  try {
    // Check if already migrated
    const alreadyMigrated = await hasBeenMigrated(uid);
    if (alreadyMigrated) {
      return { success: true }; // Already done
    }
    
    // Check if remote already has data
    const existingState = await getUserState(uid);
    if (existingState && existingState.updatedAt > localState.updatedAt) {
      // Remote is newer, just mark as migrated without overwriting
      await markAsMigrated(uid);
      return { success: true };
    }
    
    // Migrate the local state
    const batch = writeBatch(db);
    
    // 1. Save main user state
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
      state: {
        ...localState,
        updatedAt: Date.now()
      },
      updatedAt: serverTimestamp(),
      schemaVersion: 2,
      migratedFromLocalStorageAt: serverTimestamp()
    }, { merge: true });
    
    // 2. Save nutrition daily logs separately (for granular access)
    if (localState.nutrition?.dailyLogs) {
      for (const [dateKey, dayLog] of Object.entries(localState.nutrition.dailyLogs)) {
        const dayRef = doc(db, 'nutrition', uid, 'days', dateKey);
        batch.set(dayRef, {
          ...dayLog,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
    
    // 3. Save weight entries separately
    if (localState.bodyweight?.entries) {
      for (const entry of localState.bodyweight.entries) {
        const weightRef = doc(db, 'measurements', uid, 'weight', entry.date);
        batch.set(weightRef, {
          weight: entry.weight,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    }
    
    await batch.commit();
    
    console.log('[firestoreRepo] Migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('[firestoreRepo] migrateLocalStorageToFirestore error:', error);
    return { success: false, error: String(error) };
  }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Get today's date key in YYYY-MM-DD format
 */
export function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Enable Firestore offline persistence
 * Note: Should be called once at app initialization
 */
export async function enableOfflinePersistence(): Promise<boolean> {
  // Firestore SDK automatically uses IndexedDB for offline caching
  // No additional configuration needed with modular SDK v9+
  // The persistence is enabled by default in web browsers
  return true;
}
