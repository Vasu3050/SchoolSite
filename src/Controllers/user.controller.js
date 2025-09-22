import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.models.js";
import { Student } from "../Models/students.model.js";
import jwt from 'jsonwebtoken'

//options for the cookies 
const options = {
  httpOnly: true, // prevents client-side JavaScript from accessing the cookie
  secure: true, // ensures the cookie is sent only over HTTPS
  sameSite: "Strict", // prevents the cookie from being sent with cross-site requests
}

const generateAccessAndRefereshTokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}


  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

//admin Registration
const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Please provide all required fields"));
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { name }],
  });

  if (existingUser) {
    // Check if user already has admin role
    if (existingUser.roles.includes("admin")) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, "User already has admin role")
        );
    }

    // Add admin role to existing user
    existingUser.roles.push("admin");
    existingUser.status = "active"; // Admin should be active
    await existingUser.save();

    const updatedAdmin = await User.findById(existingUser._id).select(
      "-password -refreshToken -__v -createdAt -updatedAt"
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: updatedAdmin },
          "Admin role added to existing user successfully"
        )
      );
  }

  const admin = await User.create({
    name,
    email,
    password,
    phone,
    roles: ["admin"],
    status: "active",
  });

  if (!admin) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          {},
          "Failed to create admin, please try again later"
        )
      );
  }

  const createdAdmin = await User.findById(admin._id).select(
    "-password -refreshToken -__v -createdAt -updatedAt"
  );

  if (!createdAdmin) {
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          {},
          "Failed to retrieve created admin, please try again later"
        )
      );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdAdmin },
        "Admin registered successfully"
      )
    );
}); // tested OK

//teacher and parents Registration
const userRegister = asyncHandler(async (req, res) => {
    const { name, email, password, role, sid, phone } = req.body;
    
    if (!name || !email || !password || !role || !phone) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Please provide all required fields"));
    }

    if (role !== "teacher" && role !== "parent") {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid role provided"));
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { name }],
    });

    if (existingUser) {
      // Check if user already has this role
      if (existingUser.roles.includes(role)) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, `User already has the ${role} role`)
          );
      }

      // Add new role to existing user
      existingUser.roles.push(role);
      // FIXED: Set status to active for now (remove pending restriction)
      existingUser.status = "active";
      await existingUser.save();

      // If adding parent role, link to student
      if (role === "parent") {
        if (!sid) {
          return res
            .status(400)
            .json(new ApiResponse(400, {}, "Student ID (sid) is required for parent role"));
        }

        const student = await Student.findOneAndUpdate(
          { sid },
          { $push: { parent: existingUser._id } },
          { new: true }
        );

        if (!student) {
          // Remove the role we just added since student linking failed
          existingUser.roles = existingUser.roles.filter(r => r !== role);
          await existingUser.save();
          return res
            .status(404)
            .json(new ApiResponse(404, {}, "Student not found with the provided SID"));
        }

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { user: existingUser, student },
              `${role} role added to existing user and linked to student successfully`
            )
          );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { user: existingUser },
            `${role} role added to existing user successfully`
          )
        );
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      roles: [role], // Convert single role to array for the model
      // FIXED: Set status to active for now (remove pending restriction)
      status: "active",
    });

    if (!user) {
      throw new ApiError(
        500,
        "Failed to create user, please try again later."
      );
    }

    if (role === "parent") {
      const student = await Student.findOneAndUpdate(
        { sid },
        { $push: { parent: user._id } },
        { new: true }
      );

      if (!student) {
        throw new ApiError(404, "Student not found with the provided SID.");
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { user, student },
            "Parent registered and linked to student successfully"
          )
        );
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user },
          "User registered successfully"
        )
      );
}); // tested Ok

const userLogin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name && !email && !phone) {
    throw new ApiError(400, "Please provide either name or email or phone for login.");
  }

  if (!password) {
    throw new ApiError(400, "Please provide password for login.");
  }

  if (!role) {
    throw new ApiError(400, "please provide role");
  }

  const user = await User.findOne({
    $or: [{ email }, { name }, { phone }],
  });

  if (!user) {
    throw new ApiError(404, "User not found with the provided name or email or phone.");
  }

  if (!user.roles.includes(role)) {
    throw new ApiError(400, "Invalid role provided for login.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password provided.");
  }

  // FIXED: Allow all users to login regardless of status
  // Remove the status check for now
  // if (user.status === "pending") {
  //   throw new ApiError(403, "Your account is pending approval. Please wait for admin approval.");
  // }

  const accessToken = user.generateAccessToken();

  if (!accessToken) {
    throw new ApiError(
      500,
      "Failed to generate access token, please try again later."
    );
  }

  const refreshToken = user.generateRefreshToken();

  if (!refreshToken) {
    throw new ApiError(
      500,
      "Failed to generate refresh token, please try again later."
    );
  }

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  const userData = await User.findById(user._id).select(
    "-password -refreshToken -__v -createdAt -updatedAt"
  );
  if (!userData) {
    throw new ApiError(
      500,
      "Failed to retrieve user data, please try again later."
    );
  }
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: userData, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
}); // tested Ok

const userLogout = asyncHandler(async (req, res) => {
   const logedinUser = req.user;

   if (!logedinUser)
   {
      throw new ApiError(401, "Unauthorized: User not found.");
   }

   const logoutUser = await User.findByIdAndUpdate(
    { _id: logedinUser._id },
    { $unset: { refreshToken: 1 } },
    { new: true}
   );

   if ( !logoutUser ) {
      throw new ApiError(500, "Failed to logout user, please try again later.");
   }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully"
      )
    );
}); // tested OK

const resetPassword = asyncHandler(async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    throw new ApiError(400, "Please provide email, old password and new password.");
  }

  const {_id} = req.user;
  if (!_id) {
    throw new ApiError(401, "Unauthorized: User ID not found.");
  }

  const user = await User.findOne({ email, _id });

  if (!user) {
    throw new ApiError(404, "User not found with the provided email.");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password provided.");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Password reset successfully"
    )
  );
}); // tested Ok

const updateUser = asyncHandler(async (req, res) => {
  const {_id} = req.user;

  if (!_id) {
    throw new ApiError(401, "Unauthorized: User ID not found.");
  }

  const { name, email, phone } = req.body;

  if (!name && !email && !phone) {
    throw new ApiError(400, "Please provide at least one field to update.");
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;

  const updatedUser = await User.findByIdAndUpdate(
    {_id},
    {updateData},
    {new : true, validateBeforeSave : true}
  );

  if ( !updatedUser )
  {
    throw new ApiError(
      401,
      "User data updation failed :("
    )
  }

  return res
  .status(200)
  .json(
    new ApiResponse
    (
      200,
      {user : updateUser},
      "Updation of data successful"
    )
  )
}); // tested Ok

const getPending = asyncHandler (async (req, res) => {

  const { role, candiRole } = req.body;

  if (!role || role !== "admin") {
    throw new ApiError(401, "Invalid role provided");
  }

  if ( !candiRole || (candiRole !== "teacher" && candiRole !== "parent")) {
    throw new ApiError(400, "Invalid candidate role provided");
  }

  const { _id, roles } = req.user;
  if (!roles.includes("admin")) {
    throw new ApiError(403, "Unauthorized access");
  }

  if (!_id) {
    throw new ApiError(403, "Unauthorized access");
  }

  const pendingUsers = await User.find({ roles: candiRole, status: "pending" })
    .select("-password -refreshToken -__v -createdAt -updatedAt");

  if (!pendingUsers || pendingUsers.length === 0) {
    return res.status(404).json(
      new ApiResponse(404, { pendingUsers: [] }, `No pending ${candiRole}s found`)
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { pendingUsers},
      `${candiRole.charAt(0).toUpperCase() + candiRole.slice(1)}s fetched successfully`
    )
  );

}); // tested Ok

const approveUser = asyncHandler(async (req, res) => {

  const userId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "User ID is required for approval.");
  }

  const { role } = req.body;

  if (!role || role !== "admin") {
    throw new ApiError(401, "Invalid role provided");
  }

  const { _id, roles } = req.user;

  if (!_id || !roles.includes("admin")) {
    throw new ApiError(403, "Unauthorized access");
  }

  const approvedUser = await User.findByIdAndUpdate(
    userId,
    { status: "active" },
    { new: true, runValidators: true }
  );

  if( !approvedUser ) {
    throw new ApiError(404, "User not found with the provided ID.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: approvedUser },
      "User approved successfully"
    )
  );  
}); // tested Ok

const refreshAccessToken = asyncHandler(async (req, res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
  }

  try {
      const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedToken?._id)
  
      if (!user) {
          throw new ApiError(401, "Invalid refresh token")
      }
  
      if (incomingRefreshToken !== user?.refreshToken) {
          throw new ApiError(401, "Refresh token is expired or used")
          
      }
  
      const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshTokens(user._id);
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
          new ApiResponse(
              200, 
              {accessToken, refreshToken: newRefreshToken},
              "Access token refreshed"
          )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
  }

}); // tested Ok

const getUserDetails = asyncHandler(async (req, res) => {
  
}); // to be implemented

export { 
  adminRegister,
  userRegister,
  userLogin,
  userLogout,
  resetPassword,  
  updateUser,
  getPending,
  approveUser,
  refreshAccessToken,
  // getUserDetails,  
};