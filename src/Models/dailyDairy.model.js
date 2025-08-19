import mongoose, { Schema } from "mongoose";

const dailyDiarySchema = new Schema(
  {
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
    },

    visibility: {
      type: String,
    //   enum: [
    //     "all",
    //     "grade",
    //     "grade-division",
    //     "student"
    //   ],
      required: true,
    },

    writtenBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
