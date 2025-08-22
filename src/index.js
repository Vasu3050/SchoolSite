import dotenv from "dotenv";
dotenv.config({ path: './.env' });

import events from "events";
events.defaultMaxListeners = 20;

import connectDB from "./Db/index.js";
import { app } from "./app.js";
// import { startNoticeCron } from "./cron/noticBoard.cron.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server running on port ${process.env.PORT || 8000}`);
      startNoticeCron();
    });
  })
  .catch(err => console.error("MongoDB connection failed:", err));
