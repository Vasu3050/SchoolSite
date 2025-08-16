import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.models.js";
import { Student } from "../Models/students.model.js";

const getChildren = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, name, grade, sort = "asc" } = req.query;
    const { role } = req.body;
  
    if (!role || role !== "parent") {
      throw new ApiError(401, "Invalid role provided");
    }
  
    const { _id, roles } = req.user; 
  
    if (!roles.includes("parent")) {
      throw new ApiError(403, "unauthorized access");
    }
  
    if (!_id) {
      throw new ApiError(403, "unauthorized access");
    }
  
    // 🔹 Use aggregation to fetch only the children of this parent
    const matchStage = { parent: _id }; // assumes student has `parent` field
  
    if (name) matchStage.name = { $regex: name, $options: "i" };
    if (grade) matchStage.grade = grade;
  
    const studentsAgg = await Student.aggregate([
      { $match: matchStage },
      { $sort: { sid: sort === "asc" ? 1 : -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit, 10) },
    ]);
  
    const totalCount = await Student.countDocuments(matchStage);
  
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          docs: studentsAgg,
          totalDocs: totalCount,
          limit: parseInt(limit, 10),
          page: parseInt(page, 10),
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
        "Children fetched successfully"
      )
    );
  }); // tested Ok

  export {getChildren};