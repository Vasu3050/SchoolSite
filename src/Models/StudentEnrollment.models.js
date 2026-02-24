import mongoose, { Schema } from "mongoose";

const studentEnrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    academicClass: { type: Schema.Types.ObjectId, ref: "AcademicClass", required: true, index: true },
    academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    admissionNumber: { type: String, trim: true }, // optional school-specific id
    status: { type: String, enum: ["active", "promoted", "left", "transferred"], default: "active", index: true },
    joinedOn: { type: Date, default: Date.now },
    leftOn: { type: Date },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// prevent duplicate enrollment for same student in same academic year
studentEnrollmentSchema.index({ student: 1, academicYear: 1 }, { unique: true });

const StudentEnrollment = mongoose.model("StudentEnrollment", studentEnrollmentSchema);
export default StudentEnrollment;