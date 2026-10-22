const fs = require("fs");
const path = require("path");
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const CSV_PATH = path.join(
  __dirname,
  "..",
  "docs",
  "sapacr-2005-2026-v1.4.csv",
);

const YEAR = "2024/2025";
const MUNICIPALITY = "city of cape town";

const keyPath = process.argv[2];
if (!keyPath) {
  console.error(
    "Usage: node scripts/seed-areas.js <path-to-service-account.json>",
  );
  process.exit(1);
}

initializeApp({ credential: cert(require(path.resolve(keyPath))) });
const db = getFirestore();

const slug = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function readStations() {
  const [header, ...lines] = fs
    .readFileSync(CSV_PATH, "utf8")
    .trim()
    .split(/\r?\n/);
  const cols = header.split(",");
  return lines
    .map((line) =>
      Object.fromEntries(line.split(",").map((v, i) => [cols[i], v])),
    )
    .filter((row) => row.year === YEAR && row.loc_mn === MUNICIPALITY);
}

async function main() {
  const stations = readStations();
  const existing = new Set(
    (await db.collection("areas").listDocuments()).map((d) => d.id),
  );
  const batch = db.batch();

  for (const row of stations) {
    const id = slug(row.station);
    const doc = {
      station: row.station,
      name: titleCase(row.station),
      municipality: row.loc_mn,
      district: row.dc_mn,
      center: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
    };
    if (!existing.has(id)) {
      Object.assign(doc, {
        reportCount: 0,
        ratingTotal: 0,
        lastReportAt: null,
      });
    }
    batch.set(db.collection("areas").doc(id), doc, { merge: true });
  }

  await batch.commit();
  console.log(
    `Seeded ${stations.length} areas (${stations.length - existing.size} new).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
