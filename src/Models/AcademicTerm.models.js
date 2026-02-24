import mongoose, { Schema } from "mongoose";

const academicTermSchema = new Schema(
  {
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    name: {             // "Q1", "Term 1", "Semester 1"
      type: String,
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

academicTermSchema.index({ academicYear: 1, name: 1 }, { unique: true });

const AcademicTerm = mongoose.model("AcademicTerm", academicTermSchema);
export default AcademicTerm;