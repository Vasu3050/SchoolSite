import mongoose from "mongoose";
import AcademicClass from "../Models/academicClass.model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { Student } from "../Models/students.model.js"; // Student is exported as named export

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** escape regex safely */
const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** canonical grade display helper */
const canonicalGrade = (g) => {
  if (!g && g !== "") return g;
  const lower = String(g).toLowerCase();
  if (lower === "playgroup") return "Playgroup";
  if (lower === "nursery") return "Nursery";
  if (lower === "lkg") return "LKG";
  if (lower === "ukg") return "UKG";
  // keep as-is otherwise (e.g., "1st", "2nd", "10th")
  return g;
};

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

// ===== GET MY CLASSES (TEACHER) =====
export const getMyClasses = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !user.roles?.includes("teacher")) {
    throw new ApiError(403, "Access denied");
  }

  // Find classes where teacher is a class teacher or a subject teacher
  const classes = await AcademicClass.find({
    $or: [
      { classTeachers: user._id },
      { "subjectTeachers.teacher": user._id },
    ],
  })
    .populate("classTeachers", "name email")
    .populate("subjectTeachers.teacher", "name email")
    .sort({ createdAt: -1 });

  // For each class, fetch students that belong to this class (case-insensitive match)
  const classesWithStudents = await Promise.all(
    classes.map(async (clsDoc) => {
      const cls = clsDoc.toObject ? clsDoc.toObject() : JSON.parse(JSON.stringify(clsDoc));

      // Build case-insensitive regex for grade & section/division
      const gradeRegex = new RegExp(`^${escapeRegex(String(cls.grade || ""))}$`, "i");
      const sectionRegex = new RegExp(`^${escapeRegex(String(cls.section || ""))}$`, "i");

      // Query students: try matching common student fields (division, section, div)
      let students = [];
      try {
        students = await Student.find({
          grade: gradeRegex,
          $or: [
            { division: sectionRegex },
            { section: sectionRegex },
            { div: sectionRegex },
          ],
        }).select("name sid grade division section dob");
      } catch (err) {
        // Fallback: match by grade only (case-insensitive)
        students = await Student.find({ grade: gradeRegex }).select("name sid grade division section dob");
      }

      // Compute teacher role info for this class
      const isClassTeacher = (cls.classTeachers || []).some(
        (t) => String(t._id ?? t) === String(user._id)
      );

      const subjectsForTeacher = (cls.subjectTeachers || [])
        .filter((s) => String(s.teacher?._id ?? s.teacher) === String(user._id))
        .map((s) => s.subject);

      // Compose role label:
      let roleLabel = "Subject Teacher";
      if (isClassTeacher && subjectsForTeacher.length > 0) {
        roleLabel = `Class Teacher + Subject Teacher (${subjectsForTeacher.join(", ")})`;
      } else if (isClassTeacher) {
        roleLabel = "Class Teacher";
      } else if (subjectsForTeacher.length > 0) {
        roleLabel = `Subject Teacher (${subjectsForTeacher.join(", ")})`;
      }

      // Attach permissions per student for teacher actions
      const studentsWithPermissions = (students || []).map((st) => {
        const stObj = st.toObject ? st.toObject() : JSON.parse(JSON.stringify(st));
        stObj.permissions = {
          canView: true,
          canEdit: false, // teachers cannot edit student core details
          canMarkAttendance: !!(isClassTeacher || subjectsForTeacher.length > 0),
        };
        return stObj;
      });

      // Provide canonical grade display (helps frontend)
      const displayGrade = canonicalGrade(cls.grade);

      // Final object
      const out = {
        ...cls,
        grade: displayGrade,
        students: studentsWithPermissions,
        _meta: {
          teacherRole: roleLabel,
          subjectsForTeacher,
        },
      };

      return out;
    })
  );

  return res.status(200).json(
    new ApiResponse(200, classesWithStudents, "Teacher classes fetched")
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
