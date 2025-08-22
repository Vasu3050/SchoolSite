import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../Utils/cloudinary.js";
import { NoticeBoard } from "../Models/noticBoard.models.js";

const checkAuthorization = (user, role) => {
  const { _id, roles } = user;
  if (!_id || !roles || (!roles.includes("teacher") && !roles.includes("admin"))|| !role || role === "parent") {
    throw new ApiError(403, "Unauthorized request. Only teachers and admins can perform this action.");
  }
  return true;
};

const newNotice = asyncHandler ( async (req,res) => {
    checkAuthorization(req.user, req.body?.role);

    const { title, description, expiryDate } = req.body;

    if ( !title || !description )
    {
        throw new ApiError(404, "Title and desc are must");
    }

    if (expiryDate) {
        expiryDate = new Date(expiryDate);
      } else {
        expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      }

    const uploadData = {
        title,
        description,
        expiryDate,
        postedBy: req.user?._id,
    }

    const fileLocalPath = req.files?.file;

    if (fileLocalPath)
    {
        const upload = uploadOnCloudinary(fileLocalPath);

        if ( !upload )
        {
            throw new ApiError(500, "error while uploading")
        }

        uploadData.Url = upload.Url;
        uploadData.publicId = upload.publicId;
    }


    const notic = await NoticeBoard({
        uploadData
    });

    if ( !notic )
    {
        throw new ApiError(501, "problem while db upload");
    }

    return res.status(201).json(new ApiResponse(
        201,
        {notic},
        "Notic published succesfully."
    ))
});

export {
    newNotice,

} ;