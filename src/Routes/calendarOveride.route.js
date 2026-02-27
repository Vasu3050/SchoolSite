import { Router } from "express";
import {
  addOverride,
  getAllCalendarOverrides,
  getOverridesByMonth,
  updateCalendarOverride,
  deleteCalendarOverride,
} from "../Controllers/calendarOverride.controller.js";

import { verifyJWT } from "../Middelwares/auth.middelwares.js"; 

const router = Router();

router.use(verifyJWT);

router.post("/:yearId", addOverride);
router.get("/:yearId", getAllCalendarOverrides);
router.get("/:yearId/month", getOverridesByMonth);
router.patch("/:id", updateCalendarOverride);
router.delete("/:id", deleteCalendarOverride);

export default router;