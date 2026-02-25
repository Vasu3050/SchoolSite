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
  if (endDate < startDate) {
    throw new Error("End date cannot be before start date");
  }
  next();
});

const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);
export default AcademicYear;