import { Router } from "express";

import {
  createAcademicYear,
  getAllAcademicYears,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear
} from "../Controllers/acamedicYear.controller.js";

const router = Router();

// Routes
router.post("/", createAcademicYear);
router.get("/", getAllAcademicYears);
router.get("/:id", getAcademicYearById);
router.patch("/:id", updateAcademicYear);
router.delete("/:id", deleteAcademicYear);

export default router;