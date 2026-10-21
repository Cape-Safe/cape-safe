// profileValidation.ts
// Pure checks and clean-up for the emergency profile form and document files.
// No React, Firebase or network in here, so it is easy to test.

import type { EmergencyProfile, NextOfKin } from "@/types";

export const MAX_DOCUMENTS = 10;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;
export const MAX_NEXT_OF_KIN = 3;
export const BLOOD_TYPES = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown",
] as const;

const SHORT = 200;
const LONG = 1000;

export type FieldErrors = Record<string, string>;

const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPhone(value: string): boolean {
  return PHONE.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidIsoDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

function tooLong(value: string | undefined, max: number) {
  return (value ?? "").trim().length > max;
}

/** Form values are all strings, so the form can hold half-typed input. */
export type ProfileForm = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  homeCountry: string;
  idNumber: string;
  phone: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medication: string;
  medicalNotes: string;
  aidProvider: string;
  aidMemberNumber: string;
  aidPlanName: string;
  aidAssistancePhone: string;
  aidExpiry: string;
  accommodationName: string;
  accommodationAddress: string;
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
    country: string;
  }[];
};

export function emptyForm(): ProfileForm {
  return {
    fullName: "", dateOfBirth: "", nationality: "", homeCountry: "",
    idNumber: "", phone: "", bloodType: "", allergies: "", conditions: "",
    medication: "", medicalNotes: "", aidProvider: "", aidMemberNumber: "",
    aidPlanName: "", aidAssistancePhone: "", aidExpiry: "",
    accommodationName: "", accommodationAddress: "", nextOfKin: [],
  };
}

export function validateForm(form: ProfileForm): FieldErrors {
  const errors: FieldErrors = {};

  const short: (keyof ProfileForm)[] = [
    "fullName", "nationality", "homeCountry", "idNumber", "allergies",
    "conditions", "medication", "aidProvider", "aidMemberNumber",
    "aidPlanName", "accommodationName", "accommodationAddress",
  ];
  for (const key of short) {
    if (tooLong(form[key] as string, SHORT)) errors[key] = `Keep this under ${SHORT} characters.`;
  }
  if (tooLong(form.medicalNotes, LONG)) errors.medicalNotes = `Keep this under ${LONG} characters.`;

  if (form.phone.trim() && !isValidPhone(form.phone)) {
    errors.phone = "Enter a phone number like +27 82 123 4567.";
  }
  if (form.aidAssistancePhone.trim() && !isValidPhone(form.aidAssistancePhone)) {
    errors.aidAssistancePhone = "Enter a phone number like +27 82 123 4567.";
  }
  if (form.dateOfBirth.trim()) {
    if (!isValidIsoDate(form.dateOfBirth.trim())) {
      errors.dateOfBirth = "Use the format YYYY-MM-DD.";
    } else if (new Date(form.dateOfBirth.trim()) > new Date()) {
      errors.dateOfBirth = "Date of birth can't be in the future.";
    }
  }
  if (form.aidExpiry.trim() && !isValidIsoDate(form.aidExpiry.trim())) {
    errors.aidExpiry = "Use the format YYYY-MM-DD.";
  }
  if (form.bloodType && !(BLOOD_TYPES as readonly string[]).includes(form.bloodType)) {
    errors.bloodType = "Choose a blood type from the list.";
  }

  if (form.nextOfKin.length > MAX_NEXT_OF_KIN) {
    errors.nextOfKin = `You can add up to ${MAX_NEXT_OF_KIN} people.`;
  }
  form.nextOfKin.forEach((k, i) => {
    const touched = Object.values(k).some((v) => v.trim());
    if (!touched) return;
    if (!k.name.trim()) errors[`nextOfKin.${i}.name`] = "Enter their name.";
    if (!k.phone.trim()) errors[`nextOfKin.${i}.phone`] = "Enter their phone number.";
    else if (!isValidPhone(k.phone)) errors[`nextOfKin.${i}.phone`] = "Enter a phone number like +27 82 123 4567.";
    if (k.email.trim() && !isValidEmail(k.email)) errors[`nextOfKin.${i}.email`] = "That email doesn't look right.";
    if (tooLong(k.name, SHORT) || tooLong(k.relationship, SHORT) || tooLong(k.country, SHORT)) {
      errors[`nextOfKin.${i}.name`] = `Keep each field under ${SHORT} characters.`;
    }
  });

  return errors;
}

const clean = (v: string) => v.trim() || undefined;

/** Turns form strings into the object saved in Firestore (no empty fields). */
export function formToProfile(form: ProfileForm): Omit<EmergencyProfile, "consentAcceptedAt" | "updatedAt"> {
  const aid = {
    provider: clean(form.aidProvider),
    memberNumber: clean(form.aidMemberNumber),
    planName: clean(form.aidPlanName),
    assistancePhone: clean(form.aidAssistancePhone),
    expiry: clean(form.aidExpiry),
  };
  const hasAid = Object.values(aid).some(Boolean);

  const kin: NextOfKin[] = form.nextOfKin
    .filter((k) => k.name.trim() && k.phone.trim())
    .map((k) => ({
      name: k.name.trim(),
      relationship: k.relationship.trim(),
      phone: k.phone.trim(),
      ...(clean(k.email) ? { email: clean(k.email) } : {}),
      ...(clean(k.country) ? { country: clean(k.country) } : {}),
    }));

  const out: Omit<EmergencyProfile, "consentAcceptedAt" | "updatedAt"> = {
    nextOfKin: kin,
  };
  const simple = {
    fullName: clean(form.fullName),
    dateOfBirth: clean(form.dateOfBirth),
    nationality: clean(form.nationality),
    homeCountry: clean(form.homeCountry),
    idNumber: clean(form.idNumber),
    phone: clean(form.phone),
    bloodType: clean(form.bloodType),
    allergies: clean(form.allergies),
    conditions: clean(form.conditions),
    medication: clean(form.medication),
    medicalNotes: clean(form.medicalNotes),
    accommodationName: clean(form.accommodationName),
    accommodationAddress: clean(form.accommodationAddress),
  };
  for (const [k, v] of Object.entries(simple)) {
    if (v) (out as Record<string, unknown>)[k] = v;
  }
  if (hasAid) {
    out.medicalAid = Object.fromEntries(
      Object.entries(aid).filter(([, v]) => v),
    ) as EmergencyProfile["medicalAid"];
  }
  return out;
}

export function profileToForm(profile: EmergencyProfile | null): ProfileForm {
  if (!profile) return emptyForm();
  const aid = profile.medicalAid ?? {};
  return {
    fullName: profile.fullName ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    nationality: profile.nationality ?? "",
    homeCountry: profile.homeCountry ?? "",
    idNumber: profile.idNumber ?? "",
    phone: profile.phone ?? "",
    bloodType: profile.bloodType ?? "",
    allergies: profile.allergies ?? "",
    conditions: profile.conditions ?? "",
    medication: profile.medication ?? "",
    medicalNotes: profile.medicalNotes ?? "",
    aidProvider: aid.provider ?? "",
    aidMemberNumber: aid.memberNumber ?? "",
    aidPlanName: aid.planName ?? "",
    aidAssistancePhone: aid.assistancePhone ?? "",
    aidExpiry: aid.expiry ?? "",
    accommodationName: profile.accommodationName ?? "",
    accommodationAddress: profile.accommodationAddress ?? "",
    nextOfKin: (profile.nextOfKin ?? []).map((k) => ({
      name: k.name,
      relationship: k.relationship ?? "",
      phone: k.phone,
      email: k.email ?? "",
      country: k.country ?? "",
    })),
  };
}

/** Returns an error message, or null when the file can be uploaded. */
export function validateDocumentFile(
  file: { mimeType?: string | null; sizeBytes?: number | null },
  existingCount: number,
): string | null {
  if (existingCount >= MAX_DOCUMENTS) {
    return `You can store up to ${MAX_DOCUMENTS} documents. Delete one to add another.`;
  }
  if (!file.mimeType || !(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimeType)) {
    return "Only JPEG or PNG images and PDF files are allowed.";
  }
  if (file.sizeBytes != null && file.sizeBytes > MAX_DOCUMENT_BYTES) {
    return "That file is larger than 5 MB. Choose a smaller file or take a new photo.";
  }
  return null;
}

/** A safe Storage file name: no path characters, limited length. */
export function safeFileName(name: string, mimeType: string): string {
  const ext = mimeType === "application/pdf" ? "pdf" : mimeType === "image/png" ? "png" : "jpg";
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "document"}.${ext}`;
}

/** Base64 for an image downloaded with getBytes, so it can be shown without a URL. */
export function bytesToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? chars[c & 63] : "=";
  }
  return out;
}
