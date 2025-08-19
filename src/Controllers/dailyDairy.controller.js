import { asyncHandler } from "../Utils/asyncHandler";
import DailyDairy from "../Models/dailyDairy.model.js";
import { ApiError } from "../Utils/ApiError";
import { ApiResponse } from "../Utils/ApiResponse";
import { paginate } from "mongoose-paginate-v2";

const writeNew = asyncHandler ( async (req,res) => {
    
    const {_id, roles} = req.user;

    if ( !_id || !roles )
    {
        throw new ApiError(400, "Unauthorized request. User ID is required");
    }

    if ( !roles.includes("teacher") && !roles.includes("parent") )
    {
        throw new ApiError(403, "Forbidden. Only teachers and parents can write a daily diary entry.");
    }

    const { title, content, category, expiresAt, grade, division, studentId, writerRole } = req.body;

    if ( !title || !content )
    {
        throw new ApiError(400, "Title and content are required fields.");
    }

    if ( !grade && !division && !studentId )
    {
        throw new ApiError(400, "At least one of grade, division, or studentId must be provided.");
    }

    if ( !roles.includes("teacher") && !roles.includes("parent") || !roles.includes(writerRole) )
    {
        throw new ApiError(403, "Forbidden. Invalid writer role.");
    }

    if ( !["event", "notice", "homework", "other", "complaint"].includes(category) )
    {
        throw new ApiError(400, "Invalid category. Must be one of: event, notice, homework, other, complaint.");
    }   

    if ( !writerRole || !["teacher", "parent"].includes(writerRole) )
    {
        throw new ApiError(400, "Invalid writer role. Must be either 'teacher' or 'parent'.");
    }

    const dataEntry = {};

    dataEntry.title = title;
    dataEntry.content = content;
    dataEntry.category = category || "other";
    dataEntry.writtenBy = _id;
    dataEntry.writerRole = writerRole;
    if ( grade.isalpha() && grade.length === 1 )
    {
        dataEntry.grade = grade.toLowerCase();
    }

    if ( division.isalpha() && division.length === 1 )
    {
        dataEntry.division = division.toLowerCase();
    }

    if ( studentId )
    {
        dataEntry.studentId = studentId;
    }
    if ( expiresAt)
    {
        expiresAt = new Date(Date.now.setDate(expiresAt));
    }
    dataEntry.expiresAt = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const diary = await DailyDairy.create(dataEntry);

    if ( !diary )
    {
        throw new ApiError(500, "Failed to create daily diary entry.");
    }

    res.status(201).json(new ApiResponse(201,  diary, "Daily diary entry created successfully."));
});

const editDiary = asyncHandler ( async (req, res) => {

    const {_id, roles} = req.user;

    if ( !_id || !roles )
    {
        throw new ApiError(400, "Unauthorized request. User ID is required");
    }

    if ( !roles.includes("teacher") && !roles.includes("parent") )
    {
        throw new ApiError(403, "Forbidden. Only teachers and parents can write a daily diary entry.");
    }

    const { title, content, category, expiresAt, grade, division, studentId, } = req.body;

    const editData = {};

    if (title) editData.title = title;
    if (content) editData.content = content;
    if (category) {
        if (!["event", "notice", "homework", "other", "complaint"].includes(category)) {
            throw new ApiError(400, "Invalid category. Must be one of: event, notice, homework, other, complaint.");
        }
        editData.category = category;
    }
    if (expiresAt) {
        editData.expiresAt = new Date(Date.now().setDate(expiresAt));
    }
    if (grade) {
        if (grade.isalpha() && grade.length === 1) {
            editData.grade = grade.toLowerCase();
        } else {
            throw new ApiError(400, "Invalid grade format.");
        }
    }
    if (division) {
        if (division.isalpha() && division.length === 1) {
            editData.division = division.toLowerCase();
        } else {
            throw new ApiError(400, "Invalid division format.");
        }
    }
    if (studentId) editData.studentId = studentId;

    const diaryId = req.params.id;

    if (!diaryId) {
        throw new ApiError(400, "Diary ID is required for editing.");
    }

    const diary = await DailyDairy.findByIdAndUpdate(diaryId, editData, { new: true });

    if (!diary) {
        throw new ApiError(404, "Daily diary entry not found.");
    }

    res.status(200).json(new ApiResponse(200, diary, "Daily diary entry updated successfully."));    
});

const deleteDiary = asyncHandler ( async (req, res) => {
    const {_id, roles} = req.user;

    if ( !_id || !roles )
    {
        throw new ApiError(400, "Unauthorized request. User ID is required");
    }

    if ( !roles.includes("teacher") && !roles.includes("parent") )
    {
        throw new ApiError(403, "Forbidden. Only teachers and parents can delete a daily diary entry.");
    }

    const { diaryId } = req.params?.id;

    if ( !diaryId )
    {
        throw new ApiError(400, "Diary ID is required for deletion.");
    }

    const diary = await DailyDairy.findByIdAndDelete(diaryId);

    if ( !diary )
    {
        throw new ApiError(404, "Daily diary entry not found.");
    }

    res.status(200).json(new ApiResponse(200, null, "Daily diary entry deleted successfully."));
});

const getDiary = asyncHandler ( async (req, res) => {
    const {_id, roles} = req.user;

    if ( !_id || !roles )
    {
        throw new ApiError(400, "Unauthorized request. User ID is required");
    }

    if ( !roles.includes("teacher") && !roles.includes("parent") )
    {
        throw new ApiError(403, "Forbidden. Only teachers and parents can write a daily diary entry.");
    }

    const {role} = req.body;

    if (!role || !["teacher", "parent"].includes(role)) {
        throw new ApiError(400, "Invalid role. Must be either 'teacher' or 'parent'.");
    }
    
    const { studentId, grade, division, category, writtenBy, page = 1, limit = 5 } = req.query;

    const query = {};

    if (studentId) {
        query.studentId = studentId;
    }

    if (grade) {
        query.grade = grade.toLowerCase();
    }

    if (division) {
        query.division = division.toLowerCase();
    }

    if (category) {
        if (!["event", "notice", "homework", "other", "complaint"].includes(category)) {
            throw new ApiError(400, "Invalid category. Must be one of: event, notice, homework, other, complaint.");
        }
        query.category = category;
    }

    if (writtenBy) {
        query.writtenBy = writtenBy;
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }, 
    };

    const diaryEntries = await DailyDairy.paginate(query, options);

    if (!diaryEntries || diaryEntries.docs.length === 0) {
        return res.status(200).json(
        new ApiResponse(
            200,
            { diary : [] },
            "No daily diary entries found for the specified criteria."
        ))
    }

    res.status(200).json(new ApiResponse(200, diaryEntries, "Daily diary entries retrieved successfully."));
});

export {
    writeNew,
    editDiary,
    deleteDiary,
    getDiary,
};