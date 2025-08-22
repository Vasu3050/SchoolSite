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
    publicId: {
      type: String,
      required: false,
    },
    Url: {
      type: String,
      required: false,
    },
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

// Always normalize expiryDate to 00:00:00
noticeBoardSchema.pre("save", function (next) {
  if (this.expiryDate) {
    const d = new Date(this.expiryDate);
    this.expiryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()); 
    // local midnight
    // if you prefer UTC midnight:
    // this.expiryDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  } else {
    // default to 3 days later at midnight
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    this.expiryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  next();
});

// TTL index
noticeBoardSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

export const NoticeBoard = mongoose.model("NoticeBoard", noticeBoardSchema);
