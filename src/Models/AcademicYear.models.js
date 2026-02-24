import mongoose, { Schema } from "mongoose";

const academicYearSchema = new Schema(
  {
    name: {                          // e.g. "2025-2026"
      type: String,
      required: true,
      unique: true,
      match: /^\d{4}-\d{4}$/,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      // optional free-form object for school-level config for this year
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);
export default AcademicYear;