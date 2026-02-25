import { Router } from "express";

import {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear
} from "../Controllers/acamedicYear.controller.js";

import {verifyJWT} from "../Middelwares/auth.middelwares.js";

const router = Router();

router.use(verifyJWT);

// Routes
router.post("/", createAcademicYear);
router.get("/", getAllAcademicYears);
router.get("/:id", getAcademicYearById);
router.patch("/:id", updateAcademicYear);
router.delete("/:id", deleteAcademicYear);

export default router;