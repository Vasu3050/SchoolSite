import cron from "node-cron";
import { NoticeBoard } from "../models/noticeBoard.js";

// Run every day at 11 PM
cron.schedule("0 23 * * *", async () => {
  console.log("Checking for notices expiring tomorrow...");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);

  const expiringTomorrow = await NoticeBoard.find({ expiryDate: tomorrow });

  for (const notice of expiringTomorrow) {
    // Your logic here (send email/notification/log)
    console.log(`Notice expiring tomorrow: ${notice.title}`);
  }
});
