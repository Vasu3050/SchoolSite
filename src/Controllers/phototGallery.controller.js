import { PhotoGallery } from "../Models/photoGallery.models.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../Utils/cloudinary.js";

// Helper function to check authorization
const checkAuthorization = (user) => {
  const { _id, roles } = user;
  if (!_id || !roles || (!roles.includes("teacher") && !roles.includes("admin"))) {
    throw new ApiError(403, "Unauthorized request. Only teachers and admins can perform this action.");
  }
  return true;
};

const uploadNew = asyncHandler(async (req, res) => {
  checkAuthorization(req.user);
  const { _id } = req.user;

  const { file1, file2, file3, file4, file5, file6, file7, file8 } = req.files;
  const { title1, title2, title3, title4, title5, title6, title7, title8 } = req.body;

  // collect uploaded files dynamically
  const uploadedFiles = {};
  const titles = {};
  [file1, file2, file3, file4, file5, file6, file7, file8].forEach((file, idx) => {
    if (file) {
      const fileKey = `file${idx + 1}`;
      const titleKey = `title${idx + 1}`;
      uploadedFiles[fileKey] = file[0]?.path;
      titles[fileKey] = eval(`title${idx + 1}`) || `Media ${idx + 1}`; // default title if not provided
    }
  });

  const totalFiles = Object.keys(uploadedFiles).length;

  if (totalFiles === 0) {
    throw new ApiError(404, "At least one file needed to upload.");
  }
  if (totalFiles > 8) {
    throw new ApiError(400, "Only maximum 8 files are allowed.");
  }

  // fetch existing docs
  const liveDocs = await PhotoGallery.find({ event: false });
  const maxAllowed = 8;
  const existing = liveDocs.length;
  const newCount = totalFiles;

  // calculate how many old docs to remove
  const filesToRemove = Math.max(0, (existing + newCount) - maxAllowed);

  if (filesToRemove > 0) {
    const docsToRemove = liveDocs.slice(0, filesToRemove);

    // delete from cloudinary
    await Promise.all(docsToRemove.map(doc => deleteOnCloudinary(doc?.publicId)));

    // delete from DB
    await PhotoGallery.deleteMany({
      _id: { $in: docsToRemove.map(doc => doc._id) }
    });
  }

  // upload new files
  for (const [fileKey, filePath] of Object.entries(uploadedFiles)) {
    const newUpload = await uploadOnCloudinary(filePath);

    if (!newUpload) {
      throw new ApiError(500, "Unable to upload file, try again.");
    }

    // Determine if it's a video or photo based on resource_type from Cloudinary
    const mediaType = newUpload.resource_type === 'video' ? 'video' : 'photo';

    const uploading = await PhotoGallery.create({
      Url: newUpload.url,
      publicId: newUpload.publicId,
      title: titles[fileKey],
      mediaType: mediaType,
      postedBy: _id,
    });

    if (!uploading) {
      throw new ApiError(500, "Error while saving the file to DB.");
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { totalFiles }, "Media files uploaded successfully."));
}); // tested OK

const getGallery = asyncHandler(async (req, res) => {
  let gallery = await PhotoGallery.find({});

  if (!gallery) {
    return res.status(200).json(
      new ApiResponse(200, {}, "Gallery is empty.")
    );
  }

  const event = gallery.filter((doc) => {
    return doc.event == true;
  });

  gallery = gallery.filter((doc) => {
    return doc.event == false;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { event, gallery },
        "Gallery docs fetched successfully",
      )
    );
}); // tested OK

const newEvent = asyncHandler(async (req, res) => {
  checkAuthorization(req.user);
  const { _id } = req.user;

  const { file1, file2, file3, file4, file5, file6, file7, file8, file9, file10, file11, file12 } = req.files;
  const { title1, title2, title3, title4, title5, title6, title7, title8, title9, title10, title11, title12 } = req.body;

  // collect uploaded files dynamically
  const uploadedFiles = {};
  const titles = {};
  [file1, file2, file3, file4, file5, file6, file7, file8, file9, file10, file11, file12].forEach((file, idx) => {
    if (file) {
      const fileKey = `file${idx + 1}`;
      const titleKey = `title${idx + 1}`;
      uploadedFiles[fileKey] = file[0]?.path;
      titles[fileKey] = eval(`title${idx + 1}`) || `Event Media ${idx + 1}`; // default title if not provided
    }
  });

  const totalFiles = Object.keys(uploadedFiles).length;

  if (totalFiles === 0) {
    throw new ApiError(404, "At least one file needed to upload.");
  }
  if (totalFiles > 12) {
    throw new ApiError(400, "Only maximum 12 files are allowed.");
  }

  // fetch existing docs for event:true
  const liveDocs = await PhotoGallery.find({ event: true });
  const maxAllowed = 12;
  const existing = liveDocs.length;
  const newCount = totalFiles;

  // calculate how many old docs to remove
  const filesToRemove = Math.max(0, (existing + newCount) - maxAllowed);

  if (filesToRemove > 0) {
    const docsToRemove = liveDocs.slice(0, filesToRemove);

    // delete from cloudinary
    await Promise.all(docsToRemove.map(doc => deleteOnCloudinary(doc?.publicId)));

    // delete from DB
    await PhotoGallery.deleteMany({
      _id: { $in: docsToRemove.map(doc => doc._id) }
    });
  }

  // upload new files
  for (const [fileKey, filePath] of Object.entries(uploadedFiles)) {
    const newUpload = await uploadOnCloudinary(filePath);

    if (!newUpload) {
      throw new ApiError(500, "Unable to upload file, try again.");
    }

    // Determine if it's a video or photo based on resource_type from Cloudinary
    const mediaType = newUpload.resource_type === 'video' ? 'video' : 'photo';

    const uploading = await PhotoGallery.create({
      Url: newUpload.url,
      publicId: newUpload.publicId,
      title: titles[fileKey],
      mediaType: mediaType,
      event: true,
      postedBy: _id,
    });

    if (!uploading) {
      throw new ApiError(500, "Error while saving the file to DB.");
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { totalFiles }, "Event media files uploaded successfully."));
}); // tested OK

// Delete media by ID
const deletePhotoById = asyncHandler(async (req, res) => {
  checkAuthorization(req.user);

  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Media ID is required.");
  }

  // Find the media
  const media = await PhotoGallery.findById(id);

  if (!media) {
    throw new ApiError(404, "Media not found.");
  }

  // Delete from Cloudinary
  if (media.publicId) {
    await deleteOnCloudinary(media.publicId);
  }

  // Delete from database
  await PhotoGallery.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, { deletedId: id }, "Media deleted successfully."));
});

// Edit media by ID (replace with new file and/or update title)
const editPhotoById = asyncHandler(async (req, res) => {
  checkAuthorization(req.user);
  const { _id } = req.user;

  const { id } = req.params;
  const { file } = req.files;
  const { title } = req.body;

  if (!id) {
    throw new ApiError(400, "Media ID is required.");
  }

  // Find the existing media
  const existingMedia = await PhotoGallery.findById(id);

  if (!existingMedia) {
    throw new ApiError(404, "Media not found.");
  }

  let updateData = {
    postedBy: _id,
    updatedAt: new Date()
  };

  // Update title if provided
  if (title) {
    updateData.title = title;
  }

  // If new file is provided, upload it and replace the old one
  if (file && file[0]) {
    // Upload new file to Cloudinary
    const newUpload = await uploadOnCloudinary(file[0].path);

    if (!newUpload) {
      throw new ApiError(500, "Unable to upload new file, try again.");
    }

    // Delete old file from Cloudinary
    if (existingMedia.publicId) {
      await deleteOnCloudinary(existingMedia.publicId);
    }

    // Determine media type
    const mediaType = newUpload.resource_type === 'video' ? 'video' : 'photo';

    updateData.Url = newUpload.url;
    updateData.publicId = newUpload.publicId;
    updateData.mediaType = mediaType;
  }

  // Update media in database
  const updatedMedia = await PhotoGallery.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );

  if (!updatedMedia) {
    throw new ApiError(500, "Error while updating the media in DB.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedMedia, "Media updated successfully."));
});


// NEW: Delete multiple photos by IDs
const deleteMultiplePhotos = asyncHandler(async (req, res) => {
  checkAuthorization(req.user);

  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, "Array of photo IDs is required.");
  }

  // Find all photos
  const photos = await PhotoGallery.find({ _id: { $in: ids } });

  if (photos.length === 0) {
    throw new ApiError(404, "No photos found with the provided IDs.");
  }

  // Delete from Cloudinary
  await Promise.all(photos.map(photo => {
    if (photo.publicId) {
      return deleteOnCloudinary(photo.publicId);
    }
  }));

  // Delete from database
  const deleteResult = await PhotoGallery.deleteMany({ _id: { $in: ids } });

  return res
    .status(200)
    .json(new ApiResponse(200, { 
      deletedCount: deleteResult.deletedCount,
      deletedIds: ids 
    }, `${deleteResult.deletedCount} photos deleted successfully.`));
});

// Get gallery with pagination and filtering for admin/teacher management
const getGalleryForManagement = asyncHandler(async (req, res) => {
  checkAuthorization(req.user);

  const { page = 1, limit = 12, type = 'all' } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  // Build filter based on type
  let filter = {};
  if (type === 'events') {
    filter.event = true;
  } else if (type === 'gallery') {
    filter.event = false;
  }
  // If type is 'all', no filter is applied

  const gallery = await PhotoGallery.find(filter)
    .populate('postedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limitNum * 1)
    .skip((pageNum - 1) * limitNum);

  const total = await PhotoGallery.countDocuments(filter);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      gallery,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    }, "Gallery fetched successfully for management."));
});

// Get single photo details
const getPhotoById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Photo ID is required.");
  }

  const photo = await PhotoGallery.findById(id).populate('postedBy', 'name email');

  if (!photo) {
    throw new ApiError(404, "Photo not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, photo, "Photo details fetched successfully."));
});

export { 
  uploadNew, 
  getGallery, 
  newEvent, 
  deletePhotoById, 
  editPhotoById,
  deleteMultiplePhotos,
  getGalleryForManagement,
  getPhotoById,
};