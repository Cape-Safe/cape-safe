import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/services/firebase";
import type { Coordinates, Group, MemberLocation } from "@/types";

const MAX_MEMBERS = 10;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function currentUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in yet. Try again in a moment.");
  return uid;
}

const groupRef = (code: string) => doc(db, "groups", code);
const locationRef = (code: string, uid: string) =>
  doc(db, "groups", code, "locations", uid);
const userRef = (uid: string) => doc(db, "users", uid);

// Creates a group with the current user as owner. Returns the invite code.
export async function createGroup(name: string): Promise<string> {
  const uid = currentUid();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    if ((await getDoc(groupRef(code))).exists()) continue; // code taken, try another
    await setDoc(groupRef(code), {
      name: name.trim(),
      ownerId: uid,
      memberIds: [uid],
      createdAt: serverTimestamp(),
    });
    await setDoc(userRef(uid), { groupIds: arrayUnion(code) }, { merge: true });
    return code;
  }
  throw new Error("Couldn't create an invite code. Please try again.");
}

// Joins an existing group by its invite code.
export async function joinGroup(rawCode: string): Promise<void> {
  const uid = currentUid();
  const code = rawCode.trim().toUpperCase();
  const snap = await getDoc(groupRef(code));
  if (!snap.exists()) throw new Error("No group found with that code.");

  const { memberIds } = snap.data() as Group;
  if (!memberIds.includes(uid)) {
    if (memberIds.length >= MAX_MEMBERS) throw new Error("This group is full.");
    await updateDoc(groupRef(code), { memberIds: arrayUnion(uid) });
  }
  await setDoc(userRef(uid), { groupIds: arrayUnion(code) }, { merge: true });
}

// Leaves a group and removes the user's shared location from it.
export async function leaveGroup(code: string): Promise<void> {
  const uid = currentUid();
  // Delete the location first: the rules only allow it while still a member.
  await deleteDoc(locationRef(code, uid));
  await updateDoc(groupRef(code), { memberIds: arrayRemove(uid) });
  await setDoc(
    userRef(uid),
    { groupIds: arrayRemove(code), locationSharing: false },
    { merge: true },
  );
}

// Writes (overwrites) the current user's location in the group.
export function shareMyLocation(
  code: string,
  coordinates: Coordinates,
  accuracy: number,
  displayName: string,
) {
  return setDoc(locationRef(code, currentUid()), {
    displayName,
    coordinates,
    accuracy,
    updatedAt: serverTimestamp(),
  });
}

// Removes the current user's location from the group.
export function stopSharingLocation(code: string) {
  return deleteDoc(locationRef(code, currentUid()));
}

// Live updates of the group doc (name, members).
export function subscribeToGroup(
  code: string,
  onChange: (group: Group | null) => void,
) {
  return onSnapshot(
    groupRef(code),
    (snap) =>
      onChange(
        snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null,
      ),
    () => onChange(null),
  );
}

// Live updates of every shared location in the group.
export function subscribeToGroupLocations(
  code: string,
  onChange: (locations: MemberLocation[]) => void,
) {
  return onSnapshot(
    collection(db, "groups", code, "locations"),
    (snap) =>
      onChange(
        snap.docs.map(
          (d) =>
            // "estimate" fills in updatedAt locally before the server confirms it
            ({
              uid: d.id,
              ...d.data({ serverTimestamps: "estimate" }),
            }) as MemberLocation,
        ),
      ),
    () => onChange([]),
  );
}
