import { Router } from "express";
import { collections } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { toObjectId, serializeMany } from "../utils/oid.js";

const router = Router();


router.get("/",  async (req, res) => {
  const { watchlist, movies } = collections();
  const wl = await watchlist.findOne({ userUid: req.user.uid });
  if (!wl) return res.json({ userUid: req.user.uid, movieIds: [] });

  const ids = wl.movieIds?.map(id => toObjectId(id))?.filter(Boolean) || [];
  const items = ids.length ? await movies.find({ _id: { $in: ids } }).toArray() : [];
  res.json({ userUid: req.user.uid, movieIds: serializeMany(items) });
});


router.post("/:movieId",  async (req, res) => {
  const movieId = toObjectId(req.params.movieId);
  if (!movieId) return res.status(400).json({ message: "Invalid movie id" });

  const { movies, watchlist } = collections();
  const exists = await movies.findOne({ _id: movieId });
  if (!exists) return res.status(404).json({ message: "Movie not found" });

  await watchlist.updateOne(
    { userUid: req.user.uid },
    { $addToSet: { movieIds: movieId.toString() } }, 
    { upsert: true }
  );

  const wl = await watchlist.findOne({ userUid: req.user.uid });
  const ids = wl.movieIds?.map(id => toObjectId(id))?.filter(Boolean) || [];
  const items = ids.length ? await movies.find({ _id: { $in: ids } }).toArray() : [];
  res.json({ userUid: req.user.uid, movieIds: serializeMany(items) });
});


router.delete("/:movieId",  async (req, res) => {
  const movieId = toObjectId(req.params.movieId);
  if (!movieId) return res.status(400).json({ message: "Invalid movie id" });

  const { watchlist, movies } = collections();
  await watchlist.updateOne(
    { userUid: req.user.uid },
    { $pull: { movieIds: movieId.toString() } }
  );

  const wl = await watchlist.findOne({ userUid: req.user.uid });
  const ids = wl?.movieIds?.map(id => toObjectId(id))?.filter(Boolean) || [];
  const items = ids.length ? await movies.find({ _id: { $in: ids } }).toArray() : [];
  res.json({ userUid: req.user.uid, movieIds: serializeMany(items) });
});

export default router;