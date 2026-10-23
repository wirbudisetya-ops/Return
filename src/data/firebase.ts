import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { AuthorizedUser, StaffRole, DistributionCenter } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Firestore Error Handling
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration: client is offline");
    }
  }
}

// Test connection on boot
testFirestoreConnection();

// Primary Super Admin Email
export const PRIMARY_ADMIN_EMAIL = "wirbudisetya@gmail.com";

// Default Seeded Whitelist of Authorized Users
export const DEFAULT_AUTHORIZED_USERS: AuthorizedUser[] = [
  {
    email: PRIMARY_ADMIN_EMAIL,
    displayName: "Wira Budi Setya (Operator Utama / Admin)",
    role: "SUPER_ADMIN",
    allowedDCs: ["DC_SOLO", "DC_JOGJA"],
    status: "ACTIVE",
    canEditReturns: true,
    canConfirmOperator: true,
    canProcessManualReturns: true,
    canManageUsers: true,
    addedAt: "2026-08-01T08:00:00.000Z",
    addedBy: "System",
  },
  {
    email: "operator.solo@ptabc.co.id",
    displayName: "Bambang Pamungkas (Operator Retur Solo)",
    role: "OPERATOR_SOLO",
    allowedDCs: ["DC_SOLO"],
    status: "ACTIVE",
    canEditReturns: true,
    canConfirmOperator: true,
    canProcessManualReturns: true,
    canManageUsers: false,
    addedAt: "2026-08-01T08:00:00.000Z",
    addedBy: PRIMARY_ADMIN_EMAIL,
  },
  {
    email: "operator.jogja@ptabc.co.id",
    displayName: "Slamet Rahardjo (Operator Retur Jogja)",
    role: "OPERATOR_JOGJA",
    allowedDCs: ["DC_JOGJA"],
    status: "ACTIVE",
    canEditReturns: true,
    canConfirmOperator: true,
    canProcessManualReturns: true,
    canManageUsers: false,
    addedAt: "2026-08-01T08:00:00.000Z",
    addedBy: PRIMARY_ADMIN_EMAIL,
  },
  {
    email: "inbound.staff@ptabc.co.id",
    displayName: "Alfian (Tim Absolute Inbound)",
    role: "INBOUND_STAFF",
    allowedDCs: ["DC_SOLO", "DC_JOGJA"],
    status: "ACTIVE",
    canEditReturns: true,
    canConfirmOperator: false,
    canProcessManualReturns: false,
    canManageUsers: false,
    addedAt: "2026-08-01T08:00:00.000Z",
    addedBy: PRIMARY_ADMIN_EMAIL,
  },
];

const LOCAL_USERS_KEY = "pt_abc_authorized_users_v1";

// Load authorized users from local cache or default
export function getLocalAuthorizedUsers(): AuthorizedUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure primary admin is always in the list
        if (!parsed.some((u: AuthorizedUser) => u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase())) {
          return [DEFAULT_AUTHORIZED_USERS[0], ...parsed];
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load local authorized users:", e);
  }
  return DEFAULT_AUTHORIZED_USERS;
}

export function saveLocalAuthorizedUsers(users: AuthorizedUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save authorized users to local storage:", e);
  }
}

// Compute permissions based on role
export function getPermissionsByRole(role: StaffRole): {
  canEditReturns: boolean;
  canConfirmOperator: boolean;
  canProcessManualReturns: boolean;
  canManageUsers: boolean;
  allowedDCs: DistributionCenter[];
} {
  switch (role) {
    case "SUPER_ADMIN":
      return {
        canEditReturns: true,
        canConfirmOperator: true,
        canProcessManualReturns: true,
        canManageUsers: true,
        allowedDCs: ["DC_SOLO", "DC_JOGJA"],
      };
    case "OPERATOR_SOLO":
      return {
        canEditReturns: true,
        canConfirmOperator: true,
        canProcessManualReturns: true,
        canManageUsers: false,
        allowedDCs: ["DC_SOLO"],
      };
    case "OPERATOR_JOGJA":
      return {
        canEditReturns: true,
        canConfirmOperator: true,
        canProcessManualReturns: true,
        canManageUsers: false,
        allowedDCs: ["DC_JOGJA"],
      };
    case "INBOUND_STAFF":
      return {
        canEditReturns: true,
        canConfirmOperator: false,
        canProcessManualReturns: false,
        canManageUsers: false,
        allowedDCs: ["DC_SOLO", "DC_JOGJA"],
      };
    case "VIEWER":
    default:
      return {
        canEditReturns: false,
        canConfirmOperator: false,
        canProcessManualReturns: false,
        canManageUsers: false,
        allowedDCs: ["DC_SOLO", "DC_JOGJA"],
      };
  }
}

// Find authorization profile by email
export function findUserAuthorization(email: string, usersList: AuthorizedUser[]): AuthorizedUser | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  
  // Primary owner always gets SUPER_ADMIN
  if (normalized === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    const existing = usersList.find((u) => u.email.toLowerCase() === normalized);
    if (existing) return existing;
    return DEFAULT_AUTHORIZED_USERS[0];
  }

  const found = usersList.find((u) => u.email.toLowerCase() === normalized);
  return found || null;
}

// Google Sign In via Popup
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Logout
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
