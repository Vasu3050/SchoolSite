import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import CalendarOverride from "../Models/calendarOverride.model.js";

/**
 * Routes expected (example):
 * POST   /api/calendar/:yearId           -> addOverride
 * GET    /api/calendar/:yearId           -> getAllCalendarOverrides
 * GET    /api/calendar/:yearId/month?year=2026&month=3  -> getOverridesByMonth
 * PATCH  /api/calendar/:id               -> updateCalendarOverride
 * DELETE /api/calendar/:id               -> deleteCalendarOverride
 */


const addOverride = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw new ApiError(403, "Only admin can create calendar overrides.");
  }

  const { yearId } = req.params;
  const { date, title, type } = req.body;
  // accept booleans (may be false) — read them directly
  const studentAttendanceRequired = req.body.studentAttendanceRequired;
  const isFullDay = req.body.isFullDay;

  if (!yearId) {
    throw new ApiError(400, "Academic year (yearId) is required in URL params.");
  }
  if (!date || !type) {
    throw new ApiError(400, "Both date and type are required in request body.");
  }

  try {
    const created = await CalendarOverride.create({
      academicYear: yearId,
      date,
      title,
      type,
      // only include booleans if provided (otherwise model defaults apply)
      ...(studentAttendanceRequired !== undefined && { studentAttendanceRequired }),
      ...(isFullDay !== undefined && { isFullDay }),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, created, "Calendar override created successfully."));
  } catch (err) {
    // duplicate key (unique index) error
    if (err?.code === 11000) {
      throw new ApiError(400, "An override already exists for this academic year and date.");
    }
    throw err;
  }
});


const getAllCalendarOverrides = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw new ApiError(403, "Only admin can view calendar overrides.");
  }

  const { yearId } = req.params;
  if (!yearId) {
    throw new ApiError(400, "Academic year (yearId) is required in URL params.");
  }

  const overrides = await CalendarOverride.find({ academicYear: yearId }).sort({ date: 1 }).lean();
  return res.status(200).json(new ApiResponse(200, overrides, "Overrides fetched successfully."));
});

const getOverridesByMonth = asyncHandler(async (req, res) => {
  // allow non-admin read if you want: change this check. Currently keeping admin-only for parity.
  const user = req.user;
  if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw new ApiError(403, "Only admin can fetch monthly overrides.");
  }

  const { yearId } = req.params;
  const { year, month } = req.query;

  if (!yearId || !year || !month) {
    throw new ApiError(400, "academic year (yearId), year and month query params are required.");
  }

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
    throw new ApiError(400, "Invalid year or month.");
  }

  // start = first day at 00:00:00.000, end = last day 23:59:59.999
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const overrides = await CalendarOverride.find({
    academicYear: yearId,
    date: { $gte: start, $lte: end },
  })
    .sort({ date: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, overrides, "Monthly overrides fetched successfully."));
});


const updateCalendarOverride = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw new ApiError(403, "Only admin can update calendar overrides.");
  }

  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Override id is required in URL params.");
  }

  // Build updates object only with provided fields (to allow false boolean values)
  const updates = {};
  if (req.body.date !== undefined) updates.date = req.body.date;
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.studentAttendanceRequired !== undefined)
    updates.studentAttendanceRequired = req.body.studentAttendanceRequired;
  if (req.body.isFullDay !== undefined) updates.isFullDay = req.body.isFullDay;

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "At least one field must be provided to update.");
  }

  try {
    const updated = await CalendarOverride.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) throw new ApiError(404, "Override not found.");

    return res.status(200).json(new ApiResponse(200, updated, "Override updated successfully."));
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(400, "Another override already exists for this academic year and date.");
    }
    throw err;
  }
});

const deleteCalendarOverride = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw new ApiError(403, "Only admin can delete calendar overrides.");
  }

  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Override id is required in URL params.");
  }

  const deleted = await CalendarOverride.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, "Override not found.");

  return res.status(200).json(new ApiResponse(200, deleted, "Override deleted successfully."));
});

export {
  addOverride,
  getAllCalendarOverrides,
  getOverridesByMonth,
  updateCalendarOverride,
  deleteCalendarOverride,
};