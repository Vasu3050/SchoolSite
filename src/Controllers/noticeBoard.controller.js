import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../Utils/cloudinary.js";
import { NoticeBoard } from "../Models/noticBoard.models.js";

const checkAuthorization = (user, role) => {
  const { _id, roles } = user;
  if (
    !_id ||
    !roles ||
    (!roles.includes("teacher") && !roles.includes("admin")) ||
    !role ||
    role === "parent"
  ) {
    throw new ApiError(403, "Unauthorized request. Only teachers and admins can perform this action.");
  }
  return true;
};

const newNotice = asyncHandler(async (req, res) => {
  checkAuthorization(req.user, req.body?.role);

  let { title, description, expiryDate } = req.body;

  if (!title || !description) {
    throw new ApiError(404, "Title and description are required");
  }

  expiryDate = expiryDate
    ? new Date(expiryDate)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const uploadData = {
    title,
    description,
    expiryDate,
    postedBy: req.user?._id,
  };

  const fileLocalPath = req.file?.path || req.files?.file?.[0]?.path;

  if (fileLocalPath) {
    const upload = await uploadOnCloudinary(fileLocalPath);

    if (!upload) {
      throw new ApiError(500, "Error while uploading to Cloudinary");
    }

    uploadData.Url = upload.url;
    uploadData.publicId = upload.public_id;
  }

  const notice = await NoticeBoard.create(uploadData);

  if (!notice) {
    throw new ApiError(501, "Problem while saving to database");
  }

  return res.status(201).json(
    new ApiResponse(201, { notice }, "Notice published successfully.")
  );
});

const getNotice = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(403, "Unauthorized user");
  }

  const notice = await NoticeBoard.find({});

  if (!notice || notice.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, [], "There are no notices")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { notice }, "Notice fetched successfully")
  );
});

const deleteNotice = asyncHandler(async (req, res) => {
  checkAuthorization(req.user, req.body.role);

  const noticeId = req.params.id;

  if (!noticeId) {
    throw new ApiError(404, "Notice ID is required");
  }

  const deleted = await NoticeBoard.findByIdAndDelete(noticeId);

  if (!deleted) {
    throw new ApiError(501, "Error while deleting");
  }

  if (deleted.publicId) {
    await deleteOnCloudinary(deleted.publicId);
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Notice deleted successfully")
  );
});

const updateNotice = asyncHandler(async (req, res) => {
  checkAuthorization(req.user, req.body.role);

  const noticeId = req.params.id;

  if (!noticeId) {
    throw new ApiError(404, "Notice ID is required");
  }

  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(404, "Either title or description is required");
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;

  const notice = await NoticeBoard.findByIdAndUpdate(
    noticeId,
    updateData,
    { new: true }
  );

  if (!notice) {
    throw new ApiError(501, "Error while updating");
  }

  return res.status(200).json(
    new ApiResponse(200, { notice }, "Notice updated successfully")
  );
});

export { newNotice, getNotice, deleteNotice, updateNotice };
