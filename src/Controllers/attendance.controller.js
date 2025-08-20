import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { StudentAttendance } from "../Models/studentAttendance.modles.js";
import { StaffAttendance } from "../Models/staffAttendance.models.js";
import { getDistance } from "geolib";

const targetUserLatitude = parseFloat(process.env.ALLOWED_LOCATION_LATITUDE);

const targetUserLongititude = parseFloat(process.env.ALLOWED_LOCATION_LONGITITUDE);

const markPresent = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user; // fixed: req.user

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

  let marked;

  if (candiRole === "student") {
    if (role === "teacher") {
      const candiId = req.params.id;
      if (!candiId) {
        throw new ApiError(404, "Candidate Id not found.");
      }
      const startDay = new Date();
      startDay.setHours(0, 0, 0, 0);

      const endDay = new Date();
      endDay.setHours(23, 59, 59, 999);

      const isTeacherPresent = await StaffAttendance.findOne({
        staffId: _id,
        createdAt: { $gte: startDay, $lte: endDay },
      });

      if (!isTeacherPresent || isTeacherPresent.status === "absent") {
        throw new ApiError(
          403,
          "You are not allowed to mark attendance. You are marked absent for today."
        );
      }
    }

    marked = await StudentAttendance.create({ StdId: candiId });
  }
  if (candiRole === "teacher") {
    if (!userLatitude || !userLongititude) {
      throw new ApiError(
        403,
        "user is not at school location. Try again at school"
      );
    }

    const dist = getDistance(
      { latitude: targetUserLatitude, longitude: targetUserLongititude },
      { latitude: userLatitude, longitude: userLongititude }
    );

    console.log(dist);

    if (dist > process.env.RANGE_MTRS) {
      throw new ApiError(403, "First go at the school location");
    }

    marked = await StaffAttendance.create({ staffId: _id }); // fixed field
  }

  if (!marked) {
    throw new ApiError(500, "Attendance not marked.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { attendance: marked },
        "Attendance marked successfully."
      )
    );
}); // tested Ok

const getAttendanceById = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user; // fixed: req.user

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
    attendance = await StaffAttendance.findOne({ staffId: candiId });
  }
  if (candiRole === "student") {
    attendance = await StudentAttendance.findOne({ StdId: candiId });
  }

  if (!attendance) {
    throw new ApiError(404, "Attendance not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
    );
}); // tested Ok

const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user; // fixed: req.user

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role === "Parent") {
    throw new ApiError(403, "Invalid or unauthorized role.");
  }

  const date = req.params.date;
  if (!date || isNaN(Date.parse(date)) || date.trim() === "") {
    throw new ApiError(400, "Date is incorrect or not provided.");
  }

  if (!candiRole || (candiRole !== "student" && candiRole !== "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);

  let attendance;
  if (candiRole === "teacher") {
    attendance = await StaffAttendance.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });
  }
  if (candiRole === "student") {
    attendance = await StudentAttendance.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });
  }

  if (!attendance || attendance.length === 0) {
    throw new ApiError(404, "Attendance not found for the given date.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
    );
}); // tested Ok

const markAbsent = asyncHandler(async (req, res) => {
  const { _id, roles } = req.user; // fixed: req.user

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

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { attendance },
        "Attendance marked as absent successfully."
      )
    );
}); // tested Ok

export { markPresent, getAttendanceById, getAttendanceByDate, markAbsent };
