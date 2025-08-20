import { Router } from 'express';
import {
  markPresent, getAttendanceById, getAttendanceByDate, markAbsent
} from '../Controllers/attendance.controller.js';
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

router.route('/add-attendance/:id').post(verifyJWT, markPresent);
router.route('/add-attendance').post(verifyJWT, markPresent);
router.route('/delete-attendance/:id').delete(verifyJWT, markAbsent );
router.route('/get-attendance/:id').get(verifyJWT, getAttendanceById);
router.route('/get-attendances').get(verifyJWT, getAttendanceByDate);

export default router;