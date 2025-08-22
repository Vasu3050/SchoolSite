import { v2 as cloudinary } from "cloudinary"; // must be quoted
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return {
      url: response.secure_url,
      publicId: response.public_id
    };
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export const deleteOnCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto"
    });

    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};
