import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["present", "absent", "leave","late"],
      default: "absent",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StaffAttendance = mongoose.model(
  "StaffAttendance",
  staffAttendanceSchema
);
