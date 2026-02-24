// controllers/calendar.controller.js
import CalendarOverride from "../Models/CalendarOverride.models.js";
import {
  getMonthOverrides,
  createOverride,
  updateOverride,
  deleteOverride,
  getEffectiveDay,
} from "../services/calendar.service.js";
import { normalizeToDay } from "../../../School-frontend/src/utils/dateUtils.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";

/**
 * Query params:
 *  - academicYear (required)  -> ObjectId of AcademicYear
 *  - year (optional) -> numeric
 *  - month (optional) -> 1..12
 */
export const getCalendarMonth = asyncHandler(async (req, res) => {
  const { academicYear, year, month } = req.query;
  if (!academicYear) throw new ApiError(400, "academicYear is required");

  const y = year ? parseInt(year, 10) : new Date().getFullYear();
  const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;

  const overrides = await getMonthOverrides(academicYear, y, m);

  // Build result array to be used by frontend: date, type, title, affectsAttendance
  const payload = overrides.map((o) => ({
    id: o._id,
    date: normalizeToDay(o.date),
    type: o.type,
    title: o.title,
    affectsAttendance: !!o.affectsAttendance,
    notes: o.notes,
  }));

  res.status(200).json(new ApiResponse(200, payload, "Calendar overrides fetched"));
});

export const getDay = asyncHandler(async (req, res) => {
  const { academicYear } = req.query;
  const { date } = req.params;
  if (!academicYear) throw new ApiError(400, "academicYear is required");
  if (!date) throw new ApiError(400, "date is required");
  const eff = await getEffectiveDay(academicYear, date);
  res.status(200).json(new ApiResponse(200, eff, "Effective day fetched"));
});

export const createCalendarOverride = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.roles?.includes("admin")) throw new ApiError(403, "Only admin can create overrides");

  const { academicYear, date, type, title, affectsAttendance = true, notes } = req.body;
  if (!academicYear || !date || !type) throw new ApiError(400, "academicYear, date and type required");

  const created = await createOverride({ academicYear, date, type, title, affectsAttendance, notes, createdBy: user._id });
  res.status(201).json(new ApiResponse(201, created, "Override created"));
});

export const updateCalendarOverride = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.roles?.includes("admin")) throw new ApiError(403, "Only admin can update overrides");
  const { id } = req.params;
  const updates = req.body;
  const updated = await updateOverride(id, updates);
  if (!updated) throw new ApiError(404, "Override not found");
  res.status(200).json(new ApiResponse(200, updated, "Override updated"));
});

export const deleteCalendarOverride = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user?.roles?.includes("admin")) throw new ApiError(403, "Only admin can delete overrides");
  const { id } = req.params;
  await deleteOverride(id);
  res.status(200).json(new ApiResponse(200, {}, "Override deleted"));
});