import { Router } from "express";

import { 
    newNotice,
    
} from "../Controllers/noticeBoard.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";
import { upload } from "../Middelwares/multer.middelware.js";

const router = Router();

// router
//   .route("/new")
//   .post(verifyJWT, upload.fields([{ name: file, maxCount: 1 }]),);

export default router;
