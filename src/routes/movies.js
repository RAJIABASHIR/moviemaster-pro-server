import { Router } from "express";
import { collections } from "../config/db.js";
import { toObjectId, serializeId, serializeMany } from "../utils/oid.js";
import { validateMoviePayload } from "../utils/validators.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", async (req, res) => {
  try {
    const {
      page = 1, limit = 12, sortBy = "createdAt", sortOrder = "desc",
      genres, minRating, maxRating, yearFrom, yearTo, q,
    } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const allowedSort = new Set(["createdAt", "rating", "releaseYear", "title"]);
    const sb = allowedSort.has(String(sortBy)) ? String(sortBy) : "createdAt";
    const so = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sb]: so };

    
    const filter = {};

    if (genres) {
      const arr = String(genres).split(",").map(s => s.trim()).filter(Boolean);
      if (arr.length) filter.genre = { $in: arr };
    }

    const minR = Number(minRating);
    const maxR = Number(maxRating);
    if (Number.isFinite(minR) || Number.isFinite(maxR)) {
      filter.rating = {};
      if (Number.isFinite(minR)) filter.rating.$gte = minR;
      if (Number.isFinite(maxR)) filter.rating.$lte = maxR;
      if (!Object.keys(filter.rating).length) delete filter.rating;
    }

    const yFrom = Number(yearFrom);
    const yTo   = Number(yearTo);
    if (Number.isFinite(yFrom) || Number.isFinite(yTo)) {
      filter.releaseYear = {};
      if (Number.isFinite(yFrom)) filter.releaseYear.$gte = yFrom;
      if (Number.isFinite(yTo))   filter.releaseYear.$lte = yTo;
      if (!Object.keys(filter.releaseYear).length) delete filter.releaseYear;
    }

    if (q && String(q).trim()) {
      
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [
        { title: rx },
        { director: rx },
        { cast: rx },
        { plotSummary: rx },
      ];
    }

    const { movies } = collections();

    const total = await movies.countDocuments(filter);
    const data = await movies.find(filter)
      .sort(sort)
      .skip((p - 1) * l)
      .limit(l)
      .toArray();

    res.json({ total, page: p, limit: l, data: serializeMany(data) });
  } catch (e) {
    console.error("GET /movies error:", e);
    res.status(500).json({ message: "Failed to fetch movies" });
  }
});

router.get("/top-rated", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const { movies } = collections();
    const data = await movies.find({}).sort({ rating: -1 }).limit(limit).toArray();
    res.json(serializeMany(data));
  } catch (e) {
    console.error("GET /movies/top-rated error:", e);
    res.status(500).json({ message: "Failed to fetch top-rated" });
  }
});


router.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const { movies } = collections();
    const data = await movies.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    res.json(serializeMany(data));
  } catch (e) {
    console.error("GET /movies/recent error:", e);
    res.status(500).json({ message: "Failed to fetch recent" });
  }
});

router.get("/me/collection", requireAuth, async (req, res) => {
  try {
    const { movies } = collections();
    const data = await movies.find({ addedByUid: req.user?.uid }).sort({ createdAt: -1 }).toArray();
    res.json(serializeMany(data));
  } catch (e) {
    console.error("GET /movies/me/collection error:", e);
    res.status(500).json({ message: "Failed to fetch your collection" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ message: "Invalid id" });
    const { movies } = collections();
    const doc = await movies.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(serializeId(doc));
  } catch (e) {
    console.error("GET /movies/:id error:", e);
    res.status(500).json({ message: "Failed to fetch movie" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const err = validateMoviePayload(req.body);
    if (err) return res.status(400).json({ message: err });

    const { movies } = collections();
    const now = new Date();

    const payload = {
      title: (req.body.title || "").trim(),
      genre: (req.body.genre || "").trim(),
      releaseYear: Number(req.body.releaseYear),
      director: (req.body.director || "").trim(),
      cast: (req.body.cast || "").trim(),
      rating: Number(req.body.rating),
      duration: Number(req.body.duration || 0),
      plotSummary: (req.body.plotSummary || "").trim(),
      posterUrl: (req.body.posterUrl || "").trim(),
      language: (req.body.language || "English").trim(),
      country: (req.body.country || "").trim(),
      addedByEmail: (req.user?.email || req.user?.uid || "unknown"),
      addedByUid: (req.user?.uid || "unknown"),
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await movies.insertOne(payload);
    const doc = await movies.findOne({ _id: insertedId });
    res.status(201).json(serializeId(doc));
  } catch (e) {
    console.error("POST /movies error:", e);
    res.status(500).json({ message: "Failed to add movie" });
  }
});


router.put("/:id", requireAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ message: "Invalid id" });

    const { movies } = collections();
    const doc = await movies.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.addedByUid !== req.user?.uid) return res.status(403).json({ message: "Forbidden" });

    
    const { addedByEmail, addedByUid, createdAt, ...body } = req.body || {};
    const candidate = { ...doc, ...body };
    const err = validateMoviePayload(candidate);
    if (err) return res.status(400).json({ message: err });

    const update = {
      $set: {
        title: (candidate.title || "").trim(),
        genre: (candidate.genre || "").trim(),
        releaseYear: Number(candidate.releaseYear),
        director: (candidate.director || "").trim(),
        cast: (candidate.cast || "").trim(),
        rating: Number(candidate.rating),
        duration: Number(candidate.duration || 0),
        plotSummary: (candidate.plotSummary || "").trim(),
        posterUrl: (candidate.posterUrl || "").trim(),
        language: (candidate.language || "English").trim(),
        country: (candidate.country || "").trim(),
        updatedAt: new Date(),
      },
    };

    await movies.updateOne({ _id: oid }, update);
    const fresh = await movies.findOne({ _id: oid });
    res.json(serializeId(fresh));
  } catch (e) {
    console.error("PUT /movies/:id error:", e);
    res.status(500).json({ message: "Failed to update movie" });
  }
});


router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ message: "Invalid id" });

    const { movies } = collections();
    const doc = await movies.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.addedByUid !== req.user?.uid) return res.status(403).json({ message: "Forbidden" });

    await movies.deleteOne({ _id: oid });
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /movies/:id error:", e);
    res.status(500).json({ message: "Failed to delete movie" });
  }
});

export default router;
