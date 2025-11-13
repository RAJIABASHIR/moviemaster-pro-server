import fs from "fs";
import path from "path";
import admin from "firebase-admin";

let ready = false;

export function initFirebaseAdmin() {
  try {
    const p = (process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
    if (!p) {
      console.warn("[firebase] GOOGLE_APPLICATION_CREDENTIALS not set; skipping Admin init");
      return;
    }
    const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
    if (!fs.existsSync(abs)) {
      console.warn(`[firebase] Missing service account file: ${abs}; skipping Admin init`);
      return;
    }
    const sa = JSON.parse(fs.readFileSync(abs, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    ready = true;
    console.log("✅ Firebase Admin initialized");
  } catch (e) {
    console.warn("[firebase] init error:", e.message);
  }
}

export function firebaseReady() { return ready; }

export { admin };


