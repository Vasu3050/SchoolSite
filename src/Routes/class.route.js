import { Router } from "express";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";
import {
  createClass,
  getAllClasses,
  getClassById,
  assignClassTeachers,
  assignSubjectTeachers,
  getMyClasses,
} from "../Controllers/class.controller.js";

const router = Router();

// teacher
router.get("/my/classes", verifyJWT, getMyClasses);

// admin
router.post("/create", verifyJWT, createClass);
router.get("/all", verifyJWT, getAllClasses);
router.patch("/:classId/assign-class-teachers", verifyJWT, assignClassTeachers);
router.patch("/:classId/assign-subject-teachers", verifyJWT, assignSubjectTeachers);

// common (admin / teacher / parent read-only)
router.get("/:classId", verifyJWT, getClassById);

export default router;