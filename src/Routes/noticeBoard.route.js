import { Router } from "express";
import {
  newNotice,
  getNotice,
  deleteNotice,
  updateNotice,
} from "../Controllers/noticeBoard.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";
import { upload } from "../Middelwares/multer.middelware.js";

const router = Router();

router
  .route("/new")
  .post(verifyJWT, upload.single("file"), newNotice);
router.route("/").get(verifyJWT, getNotice);
router
  .route("/:id")
  .delete(verifyJWT, deleteNotice)
  .patch(verifyJWT, updateNotice);

export default router;
