import mongoose from "mongoose";

const noticeBoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      required: false,
    }, // cloudinary URL
    postedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

noticeBoardSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // time to leave feature

export const NoticeBoard = mongoose.model("NoticeBoard", noticeBoardSchema);
