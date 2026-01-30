import { Router } from "express";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  toggleClassStatus,
  deleteClass,
  getMyClasses,
} from "../Controllers/class.controller.js";

const router = Router();

router.use(verifyJWT); 

router.get("/my", getMyClasses);
router.post("/create", createClass);
router.get("/all", getAllClasses);
router.get("/:classId", getClassById);
router.patch("/:classId", updateClass);
router.patch("/:classId/status", toggleClassStatus);
router.delete("/:classId", deleteClass);



export default router;
