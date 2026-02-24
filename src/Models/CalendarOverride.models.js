import mongoose, { Schema } from "mongoose";

const calendarOverrideSchema = new Schema(
  {
    academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    date: { type: Date, required: true, index: true },          // exact day that is exception
    type: { type: String, enum: ["holiday", "working_override", "half_day", "event"], required: true },
    title: { type: String, trim: true },
    affectsAttendance: { type: Boolean, default: true },  // if false -> event only (no attendance effect)
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ensure one override per date per academic year
calendarOverrideSchema.index({ academicYear: 1, date: 1 }, { unique: true });

const CalendarOverride = mongoose.model("CalendarOverride", calendarOverrideSchema);
export default CalendarOverride;