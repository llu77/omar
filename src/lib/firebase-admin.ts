// هذا الملف للاستخدام في Server-side فقط
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  projectId: "wassel-telerehab",
  // يمكنك إضافة service account credentials هنا
};

function createFirebaseAdminApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseAdminConfig);
  }
  return getApps()[0];
}

const adminApp = createFirebaseAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);