import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5050;

(async () => {
  await connectDB(process.env.MONGO_URI, process.env.DB_NAME);
  app.listen(PORT, () =>
    console.log(`API running at http://localhost:${PORT}`)
  );
})();
