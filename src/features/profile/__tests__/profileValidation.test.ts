import {
  bytesToBase64,
  emptyForm,
  formToProfile,
  isValidIsoDate,
  isValidPhone,
  profileToForm,
  safeFileName,
  validateDocumentFile,
  validateForm,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENTS,
} from "../profileValidation";

const kin = (over = {}) => ({
  name: "Sam",
  relationship: "Brother",
  phone: "+44 7700 900123",
  email: "",
  country: "",
  ...over,
});

describe("field checks", () => {
  it("validates phone numbers", () => {
    expect(isValidPhone("+27 82 123 4567")).toBe(true);
    expect(isValidPhone("021 480 7700")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("12")).toBe(false);
  });

  it("validates real calendar dates", () => {
    expect(isValidIsoDate("1990-04-21")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2023-02-29")).toBe(false);
    expect(isValidIsoDate("21/04/1990")).toBe(false);
    expect(isValidIsoDate("1990-13-01")).toBe(false);
  });
});

describe("validateForm", () => {
  it("accepts an empty form", () => {
    expect(validateForm(emptyForm())).toEqual({});
  });

  it("flags bad phone, date and email", () => {
    const form = {
      ...emptyForm(),
      phone: "nope",
      dateOfBirth: "2999-01-01",
      aidExpiry: "soon",
      nextOfKin: [kin({ email: "not-an-email" })],
    };
    const errors = validateForm(form);
    expect(errors.phone).toBeDefined();
    expect(errors.dateOfBirth).toMatch(/future/);
    expect(errors.aidExpiry).toBeDefined();
    expect(errors["nextOfKin.0.email"]).toBeDefined();
  });

  it("requires a name and phone for a started next of kin", () => {
    const errors = validateForm({ ...emptyForm(), nextOfKin: [kin({ name: "", phone: "" })] });
    expect(errors["nextOfKin.0.name"]).toBeDefined();
    expect(errors["nextOfKin.0.phone"]).toBeDefined();
  });

  it("ignores a completely blank next of kin slot", () => {
    const blank = kin({ name: "", relationship: "", phone: "" });
    expect(validateForm({ ...emptyForm(), nextOfKin: [blank] })).toEqual({});
  });

  it("limits next of kin to three and notes to 1000 characters", () => {
    const errors = validateForm({
      ...emptyForm(),
      medicalNotes: "x".repeat(1001),
      nextOfKin: [kin(), kin(), kin(), kin()],
    });
    expect(errors.nextOfKin).toBeDefined();
    expect(errors.medicalNotes).toBeDefined();
  });
});

describe("form <-> profile", () => {
  it("drops empty fields and trims values", () => {
    const profile = formToProfile({
      ...emptyForm(),
      fullName: "  Alex Doe ",
      bloodType: "O+",
      aidProvider: "Allianz",
      aidMemberNumber: "123",
      nextOfKin: [kin(), kin({ name: "", phone: "" })],
    });
    expect(profile.fullName).toBe("Alex Doe");
    expect(profile).not.toHaveProperty("allergies");
    expect(profile.medicalAid).toEqual({ provider: "Allianz", memberNumber: "123" });
    expect(profile.nextOfKin).toHaveLength(1);
  });

  it("round-trips through the form", () => {
    const original = formToProfile({
      ...emptyForm(),
      fullName: "Alex",
      allergies: "Penicillin",
      accommodationName: "Hotel",
      nextOfKin: [kin({ email: "sam@example.com", country: "UK" })],
    });
    expect(formToProfile(profileToForm(original))).toEqual(original);
  });

  it("builds an empty form when there is no profile", () => {
    expect(profileToForm(null)).toEqual(emptyForm());
  });
});

describe("validateDocumentFile", () => {
  it("accepts allowed types under 5 MB", () => {
    expect(validateDocumentFile({ mimeType: "application/pdf", sizeBytes: 1000 }, 0)).toBeNull();
    expect(validateDocumentFile({ mimeType: "image/png", sizeBytes: MAX_DOCUMENT_BYTES }, 3)).toBeNull();
  });

  it("rejects other types, big files and a full vault", () => {
    expect(validateDocumentFile({ mimeType: "image/gif", sizeBytes: 10 }, 0)).toMatch(/JPEG/);
    expect(validateDocumentFile({ mimeType: "", sizeBytes: 10 }, 0)).toMatch(/JPEG/);
    expect(validateDocumentFile({ mimeType: "image/jpeg", sizeBytes: MAX_DOCUMENT_BYTES + 1 }, 0)).toMatch(/5 MB/);
    expect(validateDocumentFile({ mimeType: "image/jpeg", sizeBytes: 10 }, MAX_DOCUMENTS)).toMatch(/10 documents/);
  });
});

describe("safeFileName and base64", () => {
  it("removes path characters and forces the right extension", () => {
    expect(safeFileName("../../My ID (1).heic", "image/jpeg")).toBe("My-ID-1.jpg");
    expect(safeFileName("", "application/pdf")).toBe("document.pdf");
  });

  it("encodes base64 like the standard", () => {
    const enc = (s: string) => bytesToBase64(new TextEncoder().encode(s));
    expect(enc("")).toBe("");
    expect(enc("f")).toBe("Zg==");
    expect(enc("fo")).toBe("Zm8=");
    expect(enc("foo")).toBe("Zm9v");
    expect(enc("Cape Safe")).toBe("Q2FwZSBTYWZl");
  });
});
