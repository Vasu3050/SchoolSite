import mongoose from "mongoose";

const photoGallerySchema = new mongoose.Schema(
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
            type: String, // cloudinary URL 
            required: true,
        },
        postedBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const PhotoGallery = mongoose.model("PhotoGallery", photoGallerySchema);
