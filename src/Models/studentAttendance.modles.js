import mongoose from "mongoose";

const studentAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentAttendance = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema
);
