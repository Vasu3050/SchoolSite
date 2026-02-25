import mongoose, { Schema } from "mongoose";

const staffAttendanceSchema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["present", "absent", "leave", "late", "half_day"],
      required: true,
    },

    checkInTime: {
      type: Date,
    },

    checkOutTime: {
      type: Date,
    },

    locationVerified: {
      type: Boolean,
      default: false,
    },

    locationData: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same staff on same day
staffAttendanceSchema.index(
  { staffId: 1, date: 1, academicYear: 1 },
  { unique: true }
);

export const StaffAttendance = mongoose.model(
  "StaffAttendance",
  staffAttendanceSchema
);