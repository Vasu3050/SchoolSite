import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const studentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    sid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    dob: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Date of birth cannot be in the future.",
      },
    },

    grade: {
      type: String,
      enum: [
        "playgroup",
        "nursery",
        "LKG",
        "UKG",
        "1st",
        "2nd",
        "3rd",
        "4th",
        "5th",
        "6th",
        "7th",
        "8th",
        "9th",
        "10th",
      ],
      required: true,
      trim: true,
    },

    division: {
      type: String,
      required: true,
      trim: true,
      default: "A",
    },

    parent: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentSchema.virtual("age").get(function () {
  if (!this.dob) return null;
  return Math.floor((new Date() - this.dob) / (1000 * 60 * 60 * 24 * 365.25));
});


studentSchema.plugin(mongoosePaginate);

export const Student = mongoose.model("Student", studentSchema);
