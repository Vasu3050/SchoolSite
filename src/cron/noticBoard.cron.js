import cron from "node-cron";
import { NoticeBoard } from "../Models/noticBoard.models.js";
import { deleteOnCloudinary } from "../Utils/cloudinary.js";

export const startNoticeCron = () => {
    console.log("Notice Cron statred ...");

  cron.schedule("0 23 * * *", async () => {
    console.log("Checking for notices expiring tomorrow...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const notices = await NoticeBoard.find({ expiryDate: tomorrow });

    for (const notice of notices) {
      console.log(`Deleting notice: ${notice.title}`);
      await deleteOnCloudinary(notice.publicId);
    }
  });
};
