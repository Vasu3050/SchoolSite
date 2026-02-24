import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { StudentAttendance } from "../Models/studentAttendance.modles.js";
import { StaffAttendance } from "../Models/staffAttendance.models.js";
import { getDistance } from "geolib";

const targetUserLatitude = parseFloat(process.env.ALLOWED_LOCATION_LATITUDE);
const targetUserLongititude = parseFloat(process.env.ALLOWED_LOCATION_LONGITITUDE);

/**
 * Parse "HH:MM" env string into { hours, minutes }
 */
const parseTimeEnv = (envVal) => {
  if (!envVal) return null;
  const [h, m] = envVal.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { hours: h, minutes: m };
};

/**
 * Check if the current time is within the attendance window.
 * Returns { allowed: boolean, message: string }
 */
const checkAttendanceWindow = (startEnv, endEnv, label = "Attendance") => {
  const start = parseTimeEnv(startEnv);
  const end = parseTimeEnv(endEnv);

  if (!start || !end) {
    // If env vars are missing, allow by default
    return { allowed: true, message: "" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  if (currentMinutes < startMinutes) {
    return {
      allowed: false,
      message: `${label} window hasn't started yet. It opens at ${startEnv}.`,
    };
  }

  if (currentMinutes > endMinutes) {
    return {
      allowed: false,
      message: `${label} window has closed. It closed at ${endEnv}.`,
    };
  }

  return { allowed: true, message: "" };
};

const markPresent = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole, userLatitude, userLongititude } = req.body;

  if (!roles.includes(role) || role === "Parent") {
    throw new ApiError(403, "Invalid or unauthorized role.");
  }

  if (!candiRole || (candiRole !== "student" && candiRole !== "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  // ─── TEACHER SELF-ATTENDANCE ─────────────────────────────────────────────
  if (candiRole === "teacher") {
    // 1. Check time window
    const windowCheck = checkAttendanceWindow(
      process.env.TEACHER_ATTENDANCE_START,
      process.env.TEACHER_ATTENDANCE_END,
      "Teacher attendance"
    );
    if (!windowCheck.allowed) {
      throw new ApiError(403, windowCheck.message);
    }

    // 2. Check geolocation
    if (!userLatitude || !userLongititude) {
      throw new ApiError(403, "Location is required to mark teacher attendance.");
    }

    const dist = getDistance(
      { latitude: targetUserLatitude, longitude: targetUserLongititude },
      { latitude: parseFloat(userLatitude), longitude: parseFloat(userLongititude) }
    );

    console.log(`Distance from school: ${dist} meters`);

    if (dist > parseFloat(process.env.RANGE_MTRS)) {
      throw new ApiError(403, `You are too far from school. Distance: ${dist}m, Allowed: ${process.env.RANGE_MTRS}m.`);
    }

    // 3. Duplicate attendance check (one per day)
    const startDay = new Date();
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date();
    endDay.setHours(23, 59, 59, 999);

    const alreadyMarked = await StaffAttendance.findOne({
      staffId: _id,
      createdAt: { $gte: startDay, $lte: endDay },
    });

    if (alreadyMarked) {
      throw new ApiError(409, "Attendance already marked for today.");
    }

    // 4. Mark attendance
    const marked = await StaffAttendance.create({ staffId: _id });

    if (!marked) {
      throw new ApiError(500, "Attendance not marked.");
    }

    return res.status(200).json(
      new ApiResponse(200, { attendance: marked }, "Attendance marked successfully.")
    );
  }

  // ─── STUDENT ATTENDANCE (marked by teacher) ──────────────────────────────
  if (candiRole === "student") {
    // Check time window for student attendance
    const windowCheck = checkAttendanceWindow(
      process.env.STUDENT_ATTENDANCE_START,
      process.env.STUDENT_ATTENDANCE_END,
      "Student attendance"
    );
    if (!windowCheck.allowed) {
      throw new ApiError(403, windowCheck.message);
    }

    if (role === "teacher") {
      const candiId = req.params.id;
      if (!candiId) {
        throw new ApiError(404, "Candidate Id not found.");
      }

      const startDay = new Date();
      startDay.setHours(0, 0, 0, 0);
      const endDay = new Date();
      endDay.setHours(23, 59, 59, 999);

      // Teacher must be present today to mark students
      const isTeacherPresent = await StaffAttendance.findOne({
        staffId: _id,
        createdAt: { $gte: startDay, $lte: endDay },
      });

      if (!isTeacherPresent || isTeacherPresent.status === "absent") {
        throw new ApiError(
          403,
          "You are marked absent for today. You cannot mark student attendance."
        );
      }

      // Duplicate check for student
      const alreadyMarked = await StudentAttendance.findOne({
        StdId: candiId,
        createdAt: { $gte: startDay, $lte: endDay },
      });

      if (alreadyMarked) {
        throw new ApiError(409, "Student attendance already marked for today.");
      }

      const marked = await StudentAttendance.create({ StdId: candiId });

      if (!marked) {
        throw new ApiError(500, "Attendance not marked.");
      }

      return res.status(200).json(
        new ApiResponse(200, { attendance: marked }, "Student attendance marked successfully.")
      );
    }
  }

  throw new ApiError(400, "Unable to process attendance request.");
}); // tested Ok

const getAttendanceById = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role === "Parent") {
    throw new ApiError(403, "Invalid or unauthorized role.");
  }

  if (!candiRole || (candiRole !== "student" && candiRole !== "teacher")) {
    throw new ApiError(400, "Candidate role not found.");
  }

  const candiId = req.params.id;
  if (!candiId) {
    throw new ApiError(404, "Candidate Id not found.");
  }

  let attendance;
  if (candiRole === "teacher") {
    attendance = await StaffAttendance.find({ staffId: candiId }).sort({ createdAt: -1 });
  }
  if (candiRole === "student") {
    attendance = await StudentAttendance.find({ StdId: candiId }).sort({ createdAt: -1 });
  }

  if (!attendance || attendance.length === 0) {
    throw new ApiError(404, "Attendance not found.");
  }

  return res.status(200).json(
    new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
  );
}); // tested Ok

const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  // Support role/candiRole from body OR query (GET requests can't always send body)
  const role = req.body?.role || req.query?.role;
  const candiRole = req.body?.candiRole || req.query?.candiRole;

  if (!roles.includes(role) || role === "Parent") {
    throw new ApiError(403, "Invalid or unauthorized role.");
  }

  const date = req.params.date || req.query.date;
  if (!date || isNaN(Date.parse(date)) || date.trim() === "") {
    throw new ApiError(400, "Date is incorrect or not provided.");
  }

  if (!candiRole || (candiRole !== "student" && candiRole !== "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let attendance;
  if (candiRole === "teacher") {
    attendance = await StaffAttendance.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("staffId", "name email");
  }
  if (candiRole === "student") {
    attendance = await StudentAttendance.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("StdId", "name sid grade");
  }

  if (!attendance || attendance.length === 0) {
    throw new ApiError(404, "Attendance not found for the given date.");
  }

  return res.status(200).json(
    new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
  );
}); // tested Ok

const getMyAttendance = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  if (!roles.includes("teacher")) {
    throw new ApiError(403, "Only teachers can access their own attendance.");
  }

  const { month, year } = req.query;

  let query = { staffId: _id };

  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    query.createdAt = { $gte: startDate, $lte: endDate };
  } else if (year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const attendance = await StaffAttendance.find(query).sort({ createdAt: -1 });

  // Also check if already marked today
  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date();
  endDay.setHours(23, 59, 59, 999);

  const todayRecord = await StaffAttendance.findOne({
    staffId: _id,
    createdAt: { $gte: startDay, $lte: endDay },
  });

  // Compute attendance window info
  const start = parseTimeEnv(process.env.TEACHER_ATTENDANCE_START);
  const end = parseTimeEnv(process.env.TEACHER_ATTENDANCE_END);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        attendance,
        todayMarked: !!todayRecord,
        todayRecord: todayRecord || null,
        attendanceWindow: {
          start: process.env.TEACHER_ATTENDANCE_START || "08:30",
          end: process.env.TEACHER_ATTENDANCE_END || "23:00",
        },
      },
      "Attendance fetched successfully."
    )
  );
});

const markAbsent = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role === "Parent") {
    throw new ApiError(403, "Invalid or unauthorized role.");
  }

  if (!candiRole || (candiRole !== "student" && candiRole !== "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  const docId = req.params.id;
  if (!docId) {
    throw new ApiError(404, "doc Id not found.");
  }

  let attendance;
  if (candiRole === "student") {
    attendance = await StudentAttendance.findByIdAndDelete(docId);
  }
  if (candiRole === "teacher") {
    attendance = await StaffAttendance.findByIdAndDelete(docId);
  }

  if (!attendance) {
    throw new ApiError(404, "Attendance not found.");
  }

  return res.status(200).json(
    new ApiResponse(200, { attendance }, "Attendance marked as absent successfully.")
  );
}); // tested Ok

export { markPresent, getAttendanceById, getAttendanceByDate, markAbsent, getMyAttendance };