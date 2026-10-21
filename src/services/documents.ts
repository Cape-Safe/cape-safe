// documents.ts
// Uploaded documents (ID, medical aid card, insurance). The FILES live in
// Firebase Storage at users/{uid}/documents/{docId}/{filename}; only metadata
// lives in Firestore at users/{uid}/documents/{docId}. Firestore documents are
// capped at 1 MiB, so files must never go there. Never log file contents,
// paths or URLs.

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getBytes,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { db, storage } from "@/services/firebase";
import { deleteEmergencyProfile } from "@/services/emergencyProfile";
import {
  bytesToBase64,
  MAX_DOCUMENT_BYTES,
  safeFileName,
  validateDocumentFile,
} from "@/features/profile/profileValidation";
import type { DocumentType, UserDocument } from "@/types";

const docsCollection = (uid: string) => collection(db, "users", uid, "documents");

export function subscribeToDocuments(
  uid: string,
  onChange: (docs: UserDocument[]) => void,
  onError: () => void,
) {
  return onSnapshot(
    query(docsCollection(uid), orderBy("uploadedAt", "desc")),
    (snap) =>
      onChange(
        snap.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data({ serverTimestamps: "estimate" }),
            }) as UserDocument,
        ),
      ),
    () => onError(),
  );
}

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number | null;
};

/**
 * Uploads a file, then saves its metadata. If saving the metadata fails the
 * file is removed again so nothing is left behind.
 */
export async function uploadDocument(
  uid: string,
  file: PickedFile,
  type: DocumentType,
  label: string,
  existingCount: number,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const problem = validateDocumentFile(file, existingCount);
  if (problem) throw new Error(problem);

  const blob = await (await fetch(file.uri)).blob();
  if (blob.size > MAX_DOCUMENT_BYTES) {
    throw new Error("That file is larger than 5 MB. Choose a smaller file or take a new photo.");
  }

  const docRef = doc(docsCollection(uid));
  const storagePath = `users/${uid}/documents/${docRef.id}/${safeFileName(file.name, file.mimeType)}`;
  const fileRef = ref(storage, storagePath);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, blob, { contentType: file.mimeType });
    task.on(
      "state_changed",
      (s) => onProgress(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
      () => reject(new Error("Upload failed. Check your connection and try again.")),
      () => resolve(),
    );
  });

  try {
    await setDoc(docRef, {
      type,
      label: label.trim().slice(0, 100) || "Document",
      storagePath,
      mimeType: file.mimeType,
      sizeBytes: blob.size,
      uploadedAt: serverTimestamp(),
    });
  } catch {
    await deleteObject(fileRef).catch(() => {});
    throw new Error("Couldn't save the document. Please try again.");
  }
}

export async function deleteDocument(uid: string, document: UserDocument) {
  await deleteObject(ref(storage, document.storagePath)).catch((err) => {
    // A file that is already gone is fine. Anything else should surface.
    if ((err as { code?: string })?.code !== "storage/object-not-found") throw err;
  });
  await deleteDoc(doc(db, "users", uid, "documents", document.id));
}

/** Replace = upload the new file, then delete the old one. */
export async function replaceDocument(
  uid: string,
  old: UserDocument,
  file: PickedFile,
  existingCount: number,
  onProgress: (fraction: number) => void,
) {
  // The new file is added first, so the old one stays if the upload fails.
  // It doesn't count against the limit because it is removed straight after.
  await uploadDocument(uid, file, old.type, old.label, existingCount - 1, onProgress);
  await deleteDocument(uid, old);
}

/**
 * Images are fetched with getBytes and shown as a data URI, so no download
 * link is ever created. PDFs can't be shown inline, so they open through a
 * download link that is used once and never stored or shown.
 */
export async function loadImageDataUri(document: UserDocument): Promise<string> {
  const bytes = await getBytes(ref(storage, document.storagePath), MAX_DOCUMENT_BYTES);
  return `data:${document.mimeType};base64,${bytesToBase64(new Uint8Array(bytes))}`;
}

export function getPdfOpenUrl(document: UserDocument): Promise<string> {
  return getDownloadURL(ref(storage, document.storagePath));
}

/** "Delete all my emergency data": every file, every metadata doc, the profile. */
export async function deleteAllEmergencyData(uid: string) {
  const snap = await getDocs(docsCollection(uid));
  for (const d of snap.docs) {
    const data = d.data() as Partial<UserDocument>;
    if (data.storagePath) {
      await deleteObject(ref(storage, data.storagePath)).catch((err) => {
        if ((err as { code?: string })?.code !== "storage/object-not-found") throw err;
      });
    }
    await deleteDoc(d.ref);
  }
  await deleteEmergencyProfile(uid);
}
