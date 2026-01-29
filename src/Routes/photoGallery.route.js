import { Router } from "express";
import {
  uploadNew,
  getGallery,
  newEvent,
  deletePhotoById,
  editPhotoById,
  deleteMultiplePhotos,
  getGalleryForManagement,
  getPhotoById,
} from "../Controllers/phototGallery.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";
import { upload } from "../Middelwares/multer.middelware.js";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
    { name: "file3", maxCount: 1 },
    { name: "file4", maxCount: 1 },
    { name: "file5", maxCount: 1 },
    { name: "file6", maxCount: 1 },
    { name: "file7", maxCount: 1 },
    { name: "file8", maxCount: 1 },
  ]),
  uploadNew
);

router.route("/upload-event").post(
  verifyJWT,
  upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
    { name: "file3", maxCount: 1 },
    { name: "file4", maxCount: 1 },
    { name: "file5", maxCount: 1 },
    { name: "file6", maxCount: 1 },
    { name: "file7", maxCount: 1 },
    { name: "file8", maxCount: 1 },
    { name: "file9", maxCount: 1 },
    { name: "file10", maxCount: 1 },
    { name: "file11", maxCount: 1 },
    { name: "file12", maxCount: 1 },
  ]),
  newEvent
);

router.route("/").get(getGallery);

// Management routes (require authentication)
router.route("/manage").get(verifyJWT, getGalleryForManagement);
router.route("/:id").get(getPhotoById);

router.route("/delete/:id").delete(verifyJWT,deletePhotoById);
router.route("/delete").delete(verifyJWT,deleteMultiplePhotos);
router.route("/edit/:id").patch(verifyJWT, upload.fields([
  { name: "file", maxCount: 1 }
]) , editPhotoById);

export default router;
