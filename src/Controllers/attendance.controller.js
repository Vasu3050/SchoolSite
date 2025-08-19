import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.models.js";
import { Student } from "../Models/students.model.js";
import { StudentAttendance } from "../Models/studentAttendance.modles.js";
import { StaffAttendance } from "../Models/staffAttendance.models.js";

const markPresent = asyncHandler(async (req, res) => {
  const { _id, roles } = req.User;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role == "Parent") {
    throw new ApiError(403, "provide coorrect role.");
  }

  if (!candiRole || (candiRole != "student" && candiRole != "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  if (role === "teacher") {
    const startDay = new Date();
    startDay.setHours(0, 0, 0, 0);

    const endDay = new Date();
    endDay.setHours(23, 59, 59, 999);

    const isTeacherPresent = await StaffAttendance.findOne({
      staffId: _id,
      createdAt: {
        $gte: startDay,
        $lte: endDay,
      },
    });

    if (!isTeacherPresent || isTeacherPresent.status === "absent") {
      throw new ApiError(
        403,
        "You are not allowed to mark attendance. You are marked absent for today."
      );
    }
  }

  const candiId = req.params.id;

  if (!candiId) {
    throw new ApiError(404, "Candidate Id not found");
  }

  let marked;

  if (candiRole === "student") {
    marked = await StudentAttendance.create({
      StdId: candiId,
    });
  }

  if (candiRole === "teacher") {
    marked = await StaffAttendance.create({
      StdId: candiId,
    });
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
});

const getAttendanceById = asyncHandler(async (req, res) => {
  const { _id, roles } = req.User;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role == "Parent") {
    throw new ApiError(403, "provide coorrect role.");
  }

  if (!candiRole || (candiRole != "student" && candiRole != "teacher")) {
    throw new ApiError(400, "Candidate role not found.");
  }

  const candiId = req.params.id;

  if (!candiId) {
    throw new ApiError(404, "Student Id not found");
  }

  if (candiRole == "teacher") {
    const attendance = await StaffAttendance.findOne({ staffId: candiId });

    if (!attendance) {
      throw new ApiError(404, "Attendance not found.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
      );
  }

  if (candiRole == "student") {
    const attendance = await StudentAttendance.findOne({ StdId: candiId });

    if (!attendance) {
      throw new ApiError(404, "Attendance not found.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
      );
  }

  throw new ApiError(400, "Invalid candidate role.");
});

const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { _id, roles } = req.User;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role == "Parent") {
    throw new ApiError(403, "provide coorrect role.");
  }

  const date = req.params.date;

  if (!date || isNaN(Date.parse(date)) || date.trim() === "") {
    throw new ApiError(400, "Date is in incorrect or not provided.");
  }

  if (!candiRole || (candiRole != "student" && candiRole != "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  if (candiRole === "teacher") {
    const attendance = await StaffAttendance.find({
      createdAt: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
      },
    });

    if (!attendance || attendance.length === 0) {
      throw new ApiError(404, "Attendance not found for the given date.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
      );
  }

  if (candiRole === "student") {
    const attendance = await StudentAttendance.find({
      createdAt: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
      },
    });

    if (!attendance || attendance.length === 0) {
      throw new ApiError(404, "Attendance not found for the given date.");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { attendance }, "Attendance fetched successfully.")
      );
  }

  throw new ApiError(400, "Invalid candidate role.");
});

const markAbsent = asyncHandler(async (req, res) => {
  const { _id, roles } = req.User;

  if (!_id || !roles) {
    throw new ApiError(400, "Unauthorized Access.");
  }

  const { role, candiRole } = req.body;

  if (!roles.includes(role) || role == "Parent") {
    throw new ApiError(403, "provide coorrect role.");
  }

  if (!candiRole || (candiRole != "student" && candiRole != "teacher")) {
    throw new ApiError(400, "Candidate role not found or invalid.");
  }

  const docId = req.params.id;

  if (!docId) {
    throw new ApiError(404, "doc Id not found");
  }

  if (candiRole === "student") {
    const attendance = await StudentAttendance.findByIdAndDelete(docId, {
      new: true,
    });
  }

  if (candiRole === "teacher") {
    const attendance = await StaffAttendance.findByIdAndDelete(docId, {
      new: true,
    });
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
});

//mark attandance based on location

export { markPresent, getAttendanceById, getAttendanceByDate, markAbsent };
