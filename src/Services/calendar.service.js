// services/calendar.service.js
import CalendarOverride from "../Models/CalendarOverride.models.js";
import { normalizeToDay } from "../../../School-frontend/src/utils/dateUtils.js";

/**
 * Default weekly rules:
 *  - Sunday (0) => holiday
 *  - Saturday (6) => half_day
 *  - others => working
 *
 * You can change default rules here or move them into DB later.
 */

export function getDefaultDayType(date) {
  const dow = normalizeToDay(date).getDay();
  if (dow === 0) return "holiday";
  if (dow === 6) return "half_day";
  return "working";
}

export async function getOverrideForDate(academicYearId, date) {
  const d = normalizeToDay(date);
  return CalendarOverride.findOne({ academicYear: academicYearId, date: d }).lean();
}

export async function getMonthOverrides(academicYearId, year, month) {
  // month is 1..12
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  return CalendarOverride.find({
    academicYear: academicYearId,
    date: { $gte: start, $lt: end },
  }).sort({ date: 1 }).lean();
}

export async function createOverride(payload) {
  // payload must include academicYear, date, type
  payload.date = normalizeToDay(payload.date);
  return CalendarOverride.create(payload);
}

export async function updateOverride(id, updates) {
  if (updates.date) updates.date = normalizeToDay(updates.date);
  return CalendarOverride.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

export async function deleteOverride(id) {
  return CalendarOverride.findByIdAndDelete(id);
}

/**
 * Get effective day info for a date: returns object:
 * { date, source: "override"|"default", type, overrideRecord? }
 */
export async function getEffectiveDay(academicYearId, date) {
  const o = await getOverrideForDate(academicYearId, date);
  if (o) {
    return { date: normalizeToDay(date), source: "override", type: o.type, override: o };
  }
  const type = getDefaultDayType(date);
  return { date: normalizeToDay(date), source: "default", type };
}