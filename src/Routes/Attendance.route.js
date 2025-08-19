import { Router } from 'express';
import {
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendance,
  getAttendances,
} from '../Controllers/attendance.controller.js';
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

router.route('/add-attendance').post(verifyJWT, addAttendance);
router.route('/update-attendance/:id').patch(verifyJWT, updateAttendance);
router.route('/delete-attendance/:id').delete(verifyJWT, deleteAttendance);
router.route('/get-attendance/:id').get(verifyJWT, getAttendance);
router.route('/get-attendances').get(verifyJWT, getAttendances);

export default router;