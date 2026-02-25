import mongoose, { Schema } from "mongoose";

const academicYearSchema = new Schema(
  {
    name: {                          
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
  },
  { timestamps: true }
);

academicYearSchema.pre("save", async function (next) {
  // 1️⃣ Validate format logic
  const [startYear, endYear] = this.name.split("-").map(Number);

  if (startYear >= endYear) {
    return next(new Error("Academic year format invalid: First year must be smaller than second year."));
  }

  if (endYear - startYear !== 1) {
    return next(new Error("Academic year must span exactly one year (e.g., 2024-2025)."));
  }

  // 2️⃣ Validate dates order
  if (this.endDate <= this.startDate) {
    return next(new Error("End date must be after start date."));
  }

  // 3️⃣ Validate dates belong to respective years
  const startDateYear = this.startDate.getFullYear();
  const endDateYear = this.endDate.getFullYear();

  if (startDateYear !== startYear) {
    return next(new Error("Start date must belong to the first year of academic year."));
  }

  if (endDateYear !== endYear) {
    return next(new Error("End date must belong to the second year of academic year."));
  }

  next();
});

const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);
export default AcademicYear;