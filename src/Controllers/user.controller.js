import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import { User } from "../Models/user.models.js";
import { Student } from "../Models/students.model.js";

//options for the cookies 
const options = {
  httpOnly: true, // prevents client-side JavaScript from accessing the cookie
  secure: true, // ensures the cookie is sent only over HTTPS
  sameSite: "Strict", // prevents the cookie from being sent with cross-site requests
}

//admin Registration
const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
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
    const { name, email, password, role, sid } = req.body;
    
    if (!name || !email || !password || !role) {
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
      roles: [role], // Convert single role to array for the model
      status: "pending",
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
  const { name, email, password, role } = req.body;

  if (!name && !email) {
    throw new ApiError(400, "Please provide either name or email for login.");
  }

  if (!password) {
    throw new ApiError(400, "Please provide password for login.");
  }

  if (!role) {
    throw new ApiError(400, "please provide role");
  }

  const user = await User.findOne({
    $or: [{ email }, { name }],
  });

  if (!user) {
    throw new ApiError(404, "User not found with the provided name or email.");
  }

  if (!user.roles.includes(role)) {
    throw new ApiError(400, "Invalid role provided for login.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password provided.");
  }

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
}); // tested OK

const userLogout = asyncHandler(async (req, res) => {
  
});


//add Students by Admin
const addStudent = asyncHandler(async (req, res) => {
  const userRoles = req.user?.roles;

  if (!userRoles) {
    throw new ApiError(401, "Unauthorized: User roles not found.");
  }

  if (!userRoles.includes("admin")) {
    throw new ApiError(403, "Only admin can add students.");
  }

  const { name, dob, grade, division } = req.body;

  if (!name || !dob || !grade || !division) {
    throw new ApiError(400, "Please provide all required fields.");
  }

  const sid = await Student.countDocuments() + 1; 
  const formattedSid = `SID${sid.toString().padStart(2, '0')}`;

  const student = await Student.create({
    name,
    sid : formattedSid,    
    dob,
    grade,
    division,
  });

  if (!student) {
    throw new ApiError(500, "Failed to create student, please try again later.");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { student },
        "Student added successfully"
      )
    );
}) // tested Ok

export { 
  adminRegister,
  userLogin,
  userRegister,
  addStudent
};