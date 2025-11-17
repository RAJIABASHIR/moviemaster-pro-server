
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

let ready = false;

export function initFirebaseAdmin() {
  if (ready) return;

  try {

    let raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
    if (raw) {
      try {

        const dec = Buffer.from(raw, "base64").toString("utf8");
        raw = dec || raw;
      } catch {}
      const json = JSON.parse(raw);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(json) });
      }
      ready = true;
      console.log("✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT");
      return;
    }

   
    const p = (process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
    if (p) {
      const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
      if (fs.existsSync(abs)) {
        const sa = JSON.parse(fs.readFileSync(abs, "utf8"));
        if (!admin.apps.length) {
          admin.initializeApp({ credential: admin.credential.cert(sa) });
        }
        ready = true;
        console.log("✅ Firebase Admin initialized from file:", abs);
        return;
      }
      console.warn("[firebase] Service account file not found:", abs);
    }

    console.warn("[firebase] No service-account provided; Admin NOT initialized");
  } catch (e) {
    console.warn("[firebase] init error:", e?.message || e);
  }
}

export function firebaseReady() {
  return ready;
}

export { admin };



