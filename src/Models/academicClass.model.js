import mongoose, { Schema } from "mongoose";

/* Subject → Teacher (one teacher per subject per class) */
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
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    academicYear: {
      type: String,
      required: true,
      match: /^\d{4}-\d{4}$/,
    },

    classCode: {
      type: String,
      unique: true,
      index: true,
    },

    // ===== TEACHERS =====
    classTeachers: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one class teacher is required",
      },
    },

    subjectTeachers: {
      type: [subjectTeacherSchema],
      validate: {
        validator: function (arr) {
          const subjects = arr.map((s) => s.subject.toLowerCase());
          return subjects.length === new Set(subjects).size;
        },
        message: "Duplicate subjects are not allowed in a class",
      },
    },

    // ===== STUDENTS (FUTURE) =====
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // ===== STATUS =====
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ===== AUTO CLASS CODE =====
academicClassSchema.pre("save", function (next) {
  if (!this.classCode) {
    this.classCode = `${this.grade}${this.section}-${this.academicYear}`;
  }
  next();
});

const AcademicClass = mongoose.model("AcademicClass", academicClassSchema);
export default AcademicClass;