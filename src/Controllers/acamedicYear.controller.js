import AcademicYear from "../Models/AcademicYear.models.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

const createAcademicYear = asyncHandler(async (req, res) => {
    
    const {id, roles} = req.user;

    if (!id || !roles) {
        throw new ApiError(400, "Unauthorized Access.");
    }
    if (!roles.includes("admin")) {
        throw new ApiError(403, "Only admin can create academic year.");
    }

    const { name, startDate, endDate } = req.body;

    if (!startDate || !endDate || !name) {
        throw new ApiError(400, "All fields are required.");
    }

    const academicYear = await AcademicYear.create({name, startDate, endDate});
    
    if (!academicYear) {
        throw new ApiError(500, "Failed to create academic year.");
    }

    return res.status(201).json(new ApiResponse(201, academicYear, "Academic year created successfully."));
    
});

const getAllAcademicYears = asyncHandler(async (req, res) => {

    const {id, roles} = req.user;

    if (!id || !roles) {
        throw new ApiError(400, "Unauthorized Access.");
    }
    if (!roles.includes("admin")) {
        throw new ApiError(403, "Only admin can get all academic years.");
    }

    const academicYears = await AcademicYear.find();

    if (!academicYears || academicYears.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No academic years found."));
    }
    return res.status(200).json(new ApiResponse(200, academicYears, "Academic years fetched successfully."));
});

const getAcademicYearById = asyncHandler ( async(req,res)=> {

    const {id} = req.user;

    if(!id)
    {
        throw new ApiError(400, "Unauthorized Access.");
    }

    const academicYearId = req.params.id;

    if(!academicYearId)
    {
        throw new ApiError(400, "Academic year ID is required.");
    }

    const academicYear = await AcademicYear.findById(academicYearId);

    if(!academicYear)
    {
        throw new ApiError(404, "Academic year not found.");
    }

    return res.status(200).json(new ApiResponse(200, academicYear, "Academic year fetched successfully."));

});

const updateAcademicYear = asyncHandler(async (req, res) => {

    const { id, roles } = req.user;
  
    if (!id || !roles) {
      throw new ApiError(400, "Unauthorized Access.");
    }
  
    if (!roles.includes("admin")) {
      throw new ApiError(403, "Only admin can update academic year.");
    }
  
    const academicYearId = req.params.id;
  
    if (!academicYearId) {
      throw new ApiError(400, "Academic year ID is required.");
    }
  
    const { name, startDate, endDate, isActive } = req.body;
  
    if (!name && !startDate && !endDate && isActive === undefined) {
      throw new ApiError(400, "At least one field is required.");
    }
  
    let updatedData = {};
  
    if (name) updatedData.name = name;
    if (startDate) updatedData.startDate = startDate;
    if (endDate) updatedData.endDate = endDate;
  
    if (isActive === true) {
      await AcademicYear.updateMany({}, { isActive: false });
    }
  
    if (isActive !== undefined) {
      updatedData.isActive = isActive;
    }
  
    const updatedYear = await AcademicYear.findByIdAndUpdate(
      academicYearId,
      updatedData,
      { new: true }
    );
  
    if (!updatedYear) {
      throw new ApiError(500, "Update failed.");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedYear, "Update successful"));
});

const deleteAcademicYear = asyncHandler(async (req, res) => {

    const { id, roles } = req.user;
  
    if (!id || !roles) {
      throw new ApiError(401, "Unauthorized access");
    }
  
    if (!roles.includes("admin")) {
      throw new ApiError(403, "Only admin can delete academic year");
    }
  
    const academicYearId = req.params.id;
  
    if (!academicYearId) {
      throw new ApiError(400, "Academic Year ID is required");
    }
  
    const deletedYear = await AcademicYear.findByIdAndDelete(academicYearId);
  
    if (!deletedYear) {
      throw new ApiError(404, "Academic Year not found");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, deletedYear, "Deletion successful"));
  });


  export {
    createAcademicYear,
    getAllAcademicYears,
    getAcademicYearById,
    updateAcademicYear,
    deleteAcademicYear
  };


