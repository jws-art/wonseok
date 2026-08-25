import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { db, auth, initAuth, testFirestoreConnection } from "../lib/firebase";
import { ClientProfile, DailyReport } from "../types";

const PROFILES_COLLECTION = "clientProfiles";
const REPORTS_COLLECTION = "dailyReports";

export interface SyncStatus {
  connected: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

/**
 * Initialize Firebase connection and seed initial data if remote database is empty
 */
export async function initializeFirebaseData(
  defaultProfiles: ClientProfile[],
  defaultReports: DailyReport[],
  onStatusChange?: (status: SyncStatus) => void
) {
  try {
    await initAuth();
    const isConnected = await testFirestoreConnection();
    
    if (onStatusChange) {
      onStatusChange({
        connected: isConnected,
        syncing: false,
        lastSyncedAt: new Date(),
        error: null
      });
    }

    // Check if remote profiles exist; if not, seed with defaults or localStorage
    const profilesSnap = await getDocs(collection(db, PROFILES_COLLECTION));
    if (profilesSnap.empty && defaultProfiles.length > 0) {
      for (const p of defaultProfiles) {
        await saveProfileToFirestore(p);
      }
    }

    // Check if remote reports exist; if not, seed with defaults or localStorage
    const reportsSnap = await getDocs(collection(db, REPORTS_COLLECTION));
    if (reportsSnap.empty && defaultReports.length > 0) {
      for (const r of defaultReports) {
        await saveReportToFirestore(r);
      }
    }
  } catch (err) {
    console.error("Firebase init sync error:", err);
    if (onStatusChange) {
      onStatusChange({
        connected: false,
        syncing: false,
        lastSyncedAt: null,
        error: err instanceof Error ? err.message : "Firebase 연동 오류"
      });
    }
  }
}

/**
 * Real-time listener for Client Profiles
 */
export function subscribeProfiles(
  onUpdate: (profiles: ClientProfile[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, PROFILES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ClientProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || "",
          birthDate: data.birthDate,
          gender: data.gender,
          relationNotes: data.relationNotes,
          defaultTemperature: data.defaultTemperature || "36.5"
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("Error subscribing to profiles:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for Daily Reports (ordered by date/created desc)
 */
export function subscribeReports(
  onUpdate: (reports: DailyReport[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, REPORTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: DailyReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          clientId: data.clientId || "",
          clientName: data.clientName || "",
          date: data.date || "",
          sections: data.sections || {
            checkInOut: { presets: [], memo: "" },
            hygiene: { presets: [], memo: "" },
            meals: { presets: [], memo: "" },
            health: { presets: [], memo: "" },
            programs: { presets: [], memo: "" },
            other: { presets: [], memo: "" }
          },
          generatedText: data.generatedText || "",
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      // Sort desc by createdAt or date
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn("Error subscribing to reports:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a client profile in Firestore
 */
export async function saveProfileToFirestore(profile: ClientProfile): Promise<void> {
  const profileDoc = doc(db, PROFILES_COLLECTION, profile.id);
  await setDoc(profileDoc, {
    ...profile,
    userId: auth.currentUser?.uid || "anonymous",
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Delete a client profile from Firestore
 */
export async function deleteProfileFromFirestore(profileId: string): Promise<void> {
  const profileDoc = doc(db, PROFILES_COLLECTION, profileId);
  await deleteDoc(profileDoc);
}

/**
 * Save or update a daily report in Firestore
 */
export async function saveReportToFirestore(report: DailyReport): Promise<void> {
  const reportDoc = doc(db, REPORTS_COLLECTION, report.id);
  await setDoc(reportDoc, {
    ...report,
    userId: auth.currentUser?.uid || "anonymous",
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Delete a daily report from Firestore
 */
export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  const reportDoc = doc(db, REPORTS_COLLECTION, reportId);
  await deleteDoc(reportDoc);
}
