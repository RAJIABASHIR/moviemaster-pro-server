import express from "express";
import cors from "cors";
import moviesRouter from "./routes/movies.js";
import watchlistRouter from "./routes/watchlist.js";
import statsRouter from "./routes/stats.js";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import { connectDB } from "./config/db.js"; 

initFirebaseAdmin(); 

const app = express();
app.use(express.json());
app.use(cors({
  origin:["https://moviemaster-pro-client.netlify.app","http://localhost:5173"]
}))

// app.use((req, res, next) => {
//   const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
//   res.setHeader("Access-Control-Allow-Origin", origin);
 // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
//   if (req.method === "OPTIONS") return res.sendStatus(204);
//   next();
// });

app.get("/", (_req, res) => res.send("MovieMaster Pro API"));


app.use("/api/movies", moviesRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/stats", statsRouter);


let dbReady = false;
app.use(async (_req, _res, next) => {
  if (!dbReady) {
    await connectDB(process.env.MONGO_URI, process.env.DB_NAME);
    dbReady = true;
  }
  next();
});

export default app;

