import mongoose, { Schema } from "mongoose";

/**
 * Subject → Teacher mapping
 * One subject = one teacher per class
 * Same teacher can appear multiple times for different subjects
 */
const subjectTeacherSchema = new Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false }
);

const academicClassSchema = new Schema(
  {
    // ===== CLASS IDENTITY =====
    grade: {
      type: String, // "7"
      required: true,
      trim: true,
    },

    section: {
      type: String, // "A"
      required: true,
      uppercase: true,
      trim: true,
    },

    academicYear: {
      type: String, // "2025-2026"
      required: true,
      match: /^\d{4}-\d{4}$/,
    },

    classCode: {
      type: String, // "7A-2025-2026"
      unique: true,
      index: true,
    },

    // ===== TEACHERS =====
    // Minimum 1 class teacher, can be more
    classTeachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Subject-wise teachers
    subjectTeachers: [subjectTeacherSchema],

    // ===== STUDENTS (FUTURE USE) =====
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // ===== LIFECYCLE =====
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // admin
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ===== AUTO-GENERATE CLASS CODE =====
academicClassSchema.pre("save", function (next) {
  if (!this.classCode) {
    this.classCode = `${this.grade}${this.section}-${this.academicYear}`;
  }
  next();
});

export const AcademicClass = mongoose.model(
  "AcademicClass",
  academicClassSchema
);