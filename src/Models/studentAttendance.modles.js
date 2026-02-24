import mongoose, { Schema } from "mongoose";

const studentAttendanceSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    academicClass: {
      type: Schema.Types.ObjectId,
      ref: "AcademicClass",
      required: true,
      index: true,
    },

    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "excused"],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance per student per day per year
studentAttendanceSchema.index(
  { studentId: 1, date: 1, academicYear: 1 },
  { unique: true }
);

export const StudentAttendance = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema
);