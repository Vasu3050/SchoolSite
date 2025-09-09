import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { Student } from "../Models/students.model.js";

//add Students by Admin
const addStudent = asyncHandler(async (req, res) => {
  const userRoles = req.user?.roles;

  if (!userRoles) {
    throw new ApiError(401, "Unauthorized: User roles not found.");
  }

  if (!userRoles.includes("admin")) {
    throw new ApiError(403, "Only admin can add students.");
  }

  const { name, dob, grade, division } = req.body;

  if (!name || !dob || !grade || !division) {
    throw new ApiError(400, "Please provide all required fields.");
  }

  const lastStudent = await Student.findOne()
    .sort({ sid: -1 }) // Sort by sid in descending order to get the largest
    .select("sid");

  let sidNumber = 1; // Default to 1 if no students exist
  if (lastStudent && lastStudent.sid) {
    const match = lastStudent.sid.match(/^SID(\d+)$/); // Extract number from SIDXX format
    if (match) {
      sidNumber = parseInt(match[1], 10) + 1; // Increment the largest number
    }
  }

  const formattedSid = `SID${sidNumber.toString().padStart(2, "0")}`; // Format with at least 2 digits

  const student = await Student.create({
    name,
    sid: formattedSid,
    dob,
    grade,
    division,
  });

  if (!student) {
    throw new ApiError(
      500,
      "Failed to create student, please try again later."
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { student }, "Student added successfully"));
}); // tested Ok

//update Student details with role-based permissions
const updateStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required for update.");
  }

  const { name, sid, dob, grade, division, role } = req.body;

  if (!name && !sid && !dob && !grade && !division) {
    throw new ApiError(400, "Please provide at least one field to update.");
  }

  if (!role) {
    throw new ApiError(400, "Role is required to update student details.");
  }

  const { _id, roles } = req.user;

  if (!roles || !_id) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!roles.includes(role)) {
    throw new ApiError(403, "Unauthorized request");
  }

  // For parents, check if they are linked to this student
  if (role === "parent") {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, "Student not found.");
    }

    if (!student.parent.includes(_id)) {
      throw new ApiError(
        403,
        "Parents can only update their own children's details."
      );
    }
  }

  const updateData = {};

  if (name) updateData.name = name;
  if (dob) updateData.dob = dob;
  if (grade && role !== "parent") updateData.grade = grade;
  if (division && role !== "parent") updateData.division = division;
  if (sid && role === "admin") updateData.sid = sid;

  const updatedStudent = await Student.findOneAndUpdate(
    { _id: studentId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedStudent) {
    throw new ApiError(404, "Student not found with the provided ID.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { student: updatedStudent },
        "Student details updated successfully"
      )
    );
}); // tested Ok

//delete Student doc
const deleteStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required for deletion.");
  }

  const { _id, roles } = req.user;

  if (!roles || !_id) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!roles.includes("admin")) {
    throw new ApiError(403, "Only admin can delete students.");
  }

  const deletedStudent = await Student.findByIdAndDelete(studentId);

  if (!deletedStudent) {
    throw new ApiError(404, "Student not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Student deleted successfully from the database")
    );
}); // tested OK

const getStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required to fetch student");
  }

  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { role } = req.body;

  if (!role) {
    throw new ApiError(400, "Role is required");
  }

  if (!roles.includes(role)) {
    throw new ApiError(403, "Unauthorized request - invalid role");
  }

  const student = await Student.findById(studentId).populate(
    "parent",
    "name email"
  );

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (role === "parent") {
    if (!student.parent.includes(_id)) {
      throw new ApiError(403, "Parents can only fetch their own children");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { student }, "Student fetched successfully"));
}); // tested Ok

const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, name, grade, sort = "asc" } = req.query;
  const { role } = req.body;

  if (!role || role === "parent") {
    throw new ApiError(401, "Invalid role provided");
  }

  const { _id, roles } = req.user;

  if (!roles.includes(role)) {
    throw new ApiError(403, "unauthorized access");
  }

  if (!_id) {
    throw new ApiError(403, "unauthorized access");
  }

  // build search filter
  let filter = {};
  if (name) filter.name = { $regex: name, $options: "i" };
  if (grade) filter.grade = grade;

  // pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { sid: sort === "asc" ? 1 : -1 },
  };

  const students = await Student.paginate(filter, options);

  return res
    .status(200)
    .json(new ApiResponse(200, students, "Students fetched successfully"));
}); // tested Ok

export { addStudent, updateStudent, deleteStudent, getStudent, getStudents };
