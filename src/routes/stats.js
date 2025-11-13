import { Router } from "express";
import { collections } from "../config/db.js";
import { admin, firebaseReady } from "../config/firebaseAdmin.js";

const router = Router();


router.get("/", async (_req, res) => {
  
  let totalMovies = 0;
  try {
    const { movies } = collections();
    totalMovies = await movies.countDocuments();
  } catch (e) {
    console.warn("stats: movies count failed:", e.message);
  }

  
  let totalUsers = 0;
  if (firebaseReady()) {
    try {
      let token;
      do {
        const page = await admin.auth().listUsers(1000, token);
        totalUsers += page.users.length;
        token = page.pageToken;
      } while (token);
    } catch (e) {
      console.warn("stats: listUsers failed:", e.message);
    }
  }

  res.json({ totalMovies, totalUsers });
});

export default router;