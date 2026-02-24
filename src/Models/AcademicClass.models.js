import mongoose, { Schema } from "mongoose";

const academicClassSchema = new Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
    },

    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },

    classTeachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    subjectTeachers: [
      {
        subject: String,
        teacher: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

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

// Prevent duplicate class in same year
academicClassSchema.index(
  { grade: 1, section: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model("AcademicClass", academicClassSchema);