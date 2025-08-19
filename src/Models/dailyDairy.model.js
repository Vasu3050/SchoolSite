import mongoose, { Schema } from "mongoose";

const dailyDiarySchema = new Schema(
  {
    studentId: {
      type : mongoose.Schema.Types.ObjectId,
      ref : "Student",
      required : false,
    },

    grade : {
      type : String,
      required : false,
      trim: true,
      enum : ["playgroup", "nursery", "lkg", "ukg", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"],
    },

    division: {
      type: String,
      required: false,
      trim: true,
      enum: ["a", "b", "c", "d", "e","f","g"],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["event", "notice", "homework", "other", "complaint"],
      required: true,
      default: "other",
    },

    writtenBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    writerRole: {
      type: String,
      enum: ["teacher", "parent"],
      required: true,
    },
    
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index (auto-delete at expiresAt)
    },
  },
  {
    timestamps: true,
  }
);

export const DailyDiary = mongoose.model("DailyDiary", dailyDiarySchema);
