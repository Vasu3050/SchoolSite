import { Router } from 'express';
import {
  markPresent,
  getAttendanceById,
  getAttendanceByDate,
  markAbsent,
  getMyAttendance,
} from '../Controllers/attendance.controller.js';
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

// Teacher marks their OWN attendance (with geolocation)
router.route('/add-attendance/:id').post(verifyJWT, markPresent);
router.route('/add-attendance').post(verifyJWT, markPresent);

// Teacher views their OWN attendance history
router.route('/my-attendance').get(verifyJWT, getMyAttendance);

// Admin/teacher gets attendance for a specific user
router.route('/get-attendance/:id').get(verifyJWT, getAttendanceById);

// Admin/teacher gets attendance by date
router.route('/get-attendances').get(verifyJWT, getAttendanceByDate);
router.route('/get-attendances/:date').get(verifyJWT, getAttendanceByDate);

// Mark absent (delete record)
router.route('/delete-attendance/:id').delete(verifyJWT, markAbsent);

export default router;