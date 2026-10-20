import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "@/services/firebase";

export function ensureSignedIn() {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    if (!user) {
      signInAnonymously(auth).catch((err) =>
        console.warn("Anonymous sign-in failed:", err),
      );
    }
  });
}

// Creates an email account and its users profile.
export async function register(name: string, email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  await setDoc(doc(db, "users", user.uid), {
    displayName: name.trim(),
    email: user.email,
    groupIds: [],
    createdAt: serverTimestamp(),
  });
}

export function logIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

// Signs out, then back in anonymously so the map and reports keep working.
export async function logOut() {
  await signOut(auth);
  await signInAnonymously(auth);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/email-already-in-use":
    "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/network-request-failed": "No internet connection.",
};

export function authErrorMessage(err: unknown) {
  const code = (err as { code?: string } | null)?.code;
  return (
    (code && AUTH_ERRORS[code]) ||
    (err instanceof Error ? err.message : String(err))
  );
}
