import mongoose from "mongoose";
import AcademicClass from "../Models/academicClass.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===== CREATE CLASS (ADMIN) =====
export const createClass = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user || !user.roles.includes("admin")) {
    throw new ApiError(403, "Access denied");
  }

  const {
    grade,
    section,
    academicYear,
    classTeachers,
    subjectTeachers = [],
  } = req.body;

  if (!grade || !section || !academicYear) {
    throw new ApiError(400, "Grade, section and academic year are required");
  }

  if (!Array.isArray(classTeachers) || classTeachers.length === 0) {
    throw new ApiError(400, "At least one class teacher is required");
  }

  const exists = await AcademicClass.findOne({ grade, section, academicYear });
  if (exists) {
    throw new ApiError(409, "Class already exists");
  }

  const newClass = await AcademicClass.create({
    grade,
    section,
    academicYear,
    classTeachers,
    subjectTeachers,
    createdBy: user._id, // 🔥 REQUIRED BY MODEL
  });

  res.status(201).json(
    new ApiResponse(201, newClass, "Class created successfully")
  );
});

// ===== GET ALL CLASSES (ADMIN) =====
export const getAllClasses = asyncHandler(async (req, res) => {
  if (!req.user?.roles.includes("admin")) {
    throw new ApiError(403, "Access denied");
  }

  const classes = await AcademicClass.find()
    .populate("classTeachers", "name email")
    .populate("subjectTeachers.teacher", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, classes, "Classes fetched successfully")
  );
});

// ===== GET CLASS BY ID =====
export const getClassById = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!isValidId(classId)) {
    throw new ApiError(400, "Invalid class ID");
  }

  const cls = await AcademicClass.findById(classId)
    .populate("classTeachers", "name email")
    .populate("subjectTeachers.teacher", "name email");

  if (!cls) {
    throw new ApiError(404, "Class not found");
  }

  res.status(200).json(
    new ApiResponse(200, cls, "Class fetched successfully")
  );
});

// ===== UPDATE CLASS (ADMIN) =====
export const updateClass = asyncHandler(async (req, res) => {
  if (!req.user?.roles.includes("admin")) {
    throw new ApiError(403, "Access denied");
  }

  const { classId } = req.params;
  const updates = req.body;

  if (!isValidId(classId)) {
    throw new ApiError(400, "Invalid class ID");
  }

  const updatedClass = await AcademicClass.findByIdAndUpdate(
    classId,
    updates,
    { new: true, runValidators: true }
  );

  if (!updatedClass) {
    throw new ApiError(404, "Class not found");
  }

  res.status(200).json(
    new ApiResponse(200, updatedClass, "Class updated successfully")
  );
});

// ===== TOGGLE ACTIVE / ARCHIVED =====
export const toggleClassStatus = asyncHandler(async (req, res) => {
  if (!req.user?.roles.includes("admin")) {
    throw new ApiError(403, "Access denied");
  }

  const { classId } = req.params;

  const cls = await AcademicClass.findById(classId);
  if (!cls) {
    throw new ApiError(404, "Class not found");
  }

  cls.status = cls.status === "active" ? "archived" : "active";
  await cls.save();

  res.status(200).json(
    new ApiResponse(200, cls, `Class ${cls.status}`)
  );
});

// ===== DELETE CLASS (ADMIN) =====
export const deleteClass = asyncHandler(async (req, res) => {
  if (!req.user?.roles.includes("admin")) {
    throw new ApiError(403, "Access denied");
  }

  const { classId } = req.params;

  if (!isValidId(classId)) {
    throw new ApiError(400, "Invalid class ID");
  }

  const deleted = await AcademicClass.findByIdAndDelete(classId);
  if (!deleted) {
    throw new ApiError(404, "Class not found");
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Class deleted successfully")
  );
});
