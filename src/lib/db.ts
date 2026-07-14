import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Customer, Commodity, Request, Collection, Payment, Expenditure, Note } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic fetch by userId
export async function fetchUserDocs<T>(collectionName: string, userId: string): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const docs: T[] = [];
    querySnapshot.forEach((doc) => {
      // Remove userId from the returned object to keep the original types pristine
      const { userId: _, ...data } = doc.data();
      docs.push({ id: doc.id, ...data } as T);
    });
    return docs;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

// Generic save (setDoc)
export async function saveUserDoc(collectionName: string, userId: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      userId
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

// Generic delete
export async function deleteUserDoc(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

// Seed user with demo data if they have 0 documents
export async function seedDemoDataIfNew(
  userId: string, 
  initialData: {
    customers: Customer[];
    commodities: Commodity[];
    requests: Request[];
    collections: Collection[];
    payments: Payment[];
    expenditures: Expenditure[];
    notes: Note[];
  }
) {
  let isNew = false;
  try {
    // Check if customers already exist in Firestore for this user
    const q = query(collection(db, "customers"), where("userId", "==", userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return; // Already has data, do not seed
    }
    isNew = true;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "customers");
  }

  if (isNew) {
    try {
      // Seed data using batches
      const batch = writeBatch(db);

      initialData.customers.forEach(c => {
        batch.set(doc(db, "customers", c.id), { ...c, userId });
      });
      initialData.commodities.forEach(c => {
        batch.set(doc(db, "commodities", c.id), { ...c, userId });
      });
      initialData.requests.forEach(r => {
        batch.set(doc(db, "requests", r.id), { ...r, userId });
      });
      initialData.collections.forEach(col => {
        batch.set(doc(db, "collections", col.id), { ...col, userId });
      });
      initialData.payments.forEach(p => {
        batch.set(doc(db, "payments", p.id), { ...p, userId });
      });
      initialData.expenditures.forEach(e => {
        batch.set(doc(db, "expenditures", e.id), { ...e, userId });
      });
      initialData.notes.forEach(n => {
        batch.set(doc(db, "notes", n.id), { ...n, userId });
      });

      await batch.commit();
      console.log("Demo data successfully seeded in Firestore for user:", userId);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "batch-seed");
    }
  }
}

// Clear all data for a specific user to start clean
export async function clearAllUserData(userId: string) {
  try {
    const collectionsToClear = ['customers', 'commodities', 'requests', 'collections', 'payments', 'expenditures', 'notes'];
    const batch = writeBatch(db);
    let hasOps = false;

    for (const collName of collectionsToClear) {
      const q = query(collection(db, collName), where("userId", "==", userId));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        batch.delete(docSnap.ref);
        hasOps = true;
      });
    }

    if (hasOps) {
      await batch.commit();
      console.log("Successfully wiped all user documents in Firestore for:", userId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, "clear-all-user-data");
  }
}

