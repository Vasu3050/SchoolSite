import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { Student } from "../Models/students.model.js";


const getParents = asyncHandler ( async (req, res) => {
  
  const { role } = req.body;

  if (!role || role == "parent") {
    throw new ApiError(401, "Invalid role provided");
  }

  const { _id, roles } = req.user;
  if (!_id || !roles.includes(role)) {
    throw new ApiError(403, "Unauthorized access");
  }

  const studentId = req.params.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required to fetch parents");
  }

  const student = await Student.findById(studentId).populate("parent", "name email phone");

  if (!student)
  {
    throw new ApiError(404, "Student not found with the provided ID.");
  }

  return res.status(200).json({
    status: 200,
    data: {
      parents: student.parent
    },
    message: "Parents fetched successfully"
  });

}); //tested Ok

export {getParents,};
