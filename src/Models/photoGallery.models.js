import mongoose from "mongoose";

const photoGallerySchema = new mongoose.Schema(
    {   
        title : {
            type : String,
            required : true,
            trim : true,
        },

        Url: {
            type: String, // cloudinary URL 
            required: true,
        },

        publicId : {
            type: String, // cloudinary URL 
            required: true,
        },

        postedBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        event : {
            type : Boolean,
            default : false,
        }
    },
    {
        timestamps: true,
    }
);

export const PhotoGallery = mongoose.model("PhotoGallery", photoGallerySchema);
