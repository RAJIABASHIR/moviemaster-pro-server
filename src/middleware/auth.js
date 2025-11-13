import { admin, firebaseReady } from "../config/firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    if (!firebaseReady()) {
      return res.status(401).json({ message: "Auth disabled on server (Firebase Admin not initialized)" });
    }
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || "" };
    next();
  } catch (e) {
    console.error("Auth error:", e.message);
    res.status(401).json({ message: "Invalid token" });
  }
}
