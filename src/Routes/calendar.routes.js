// routes/calendar.routes.js
import { Router } from "express";
import {
  getCalendarMonth,
  createCalendarOverride,
  updateCalendarOverride,
  deleteCalendarOverride,
  getDay,
} from "../controllers/calendar.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js"; // adjust path if needed

const router = Router();
router.use(verifyJWT);

// admin endpoints (create/update/delete)
router.post("/", createCalendarOverride);
router.patch("/:id", updateCalendarOverride);
router.delete("/:id", deleteCalendarOverride);

// public for authenticated users
router.get("/month", getCalendarMonth); // expects ?academicYear=&year=&month=
router.get("/day/:date", getDay); // expects ?academicYear=<id>

export default router;