import mongoose from "mongoose";
const { Schema } = mongoose;

const calendarOverrideSchema = new Schema(
  {
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    title: {
      type: String,
      trim: true,
      minlength: 3,
    },

    type: {
      type: String,
      enum: [
        "national_holiday",
        "declared_holiday",
        "state_holiday",
        "vacation",
        "study_holiday",
        "working_override",
        "event",
        "other",
      ],
      required: true,
      default: "declared_holiday",
    },

    studentAttendanceRequired: {
      type: Boolean,
      default: true, // true = attendance needed for student
    },

    isFullDay: {
      type: Boolean,
      default: true, // true = full day, false = half day
    },
  },
  { timestamps: true }
);

// prevent duplicate override per academic year
calendarOverrideSchema.index({ academicYear: 1, date: 1 }, { unique: true });

const CalendarOverride = mongoose.model(
  "CalendarOverride",
  calendarOverrideSchema
);

export default CalendarOverride;
