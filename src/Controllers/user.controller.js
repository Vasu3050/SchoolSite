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

//update Student details with role-based permissions
const updateStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if(!studentId) {
    throw new ApiError(400, "Student ID is required for update.");
  }

  const {name, sid, dob, grade, division, role} = req.body;

  if (!name && !sid && !dob && !grade && !division) {
    throw new ApiError(400, "Please provide at least one field to update.");
  }

  if(!role) {
    throw new ApiError(400, "Role is required to update student details.");
  }

  const {_id, roles} = req.user;

  if (!roles || !_id) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!roles.includes(role)) {
    throw new ApiError(403, "Unauthorized request");
  }  

  // For parents, check if they are linked to this student
  if (role === "parent") {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, "Student not found.");
    }
    
    if (!student.parent.includes(_id)) {
      throw new ApiError(403, "Parents can only update their own children's details.");
    }
  }

  const updateData = {};

  if (name) updateData.name = name;
  if (dob) updateData.dob = dob; 
  if (grade && role !== "parent") updateData.grade = grade;
  if (division && role !== "parent") updateData.division = division;
  if (sid && role === "admin") updateData.sid = sid;

  const updatedStudent = await Student.findOneAndUpdate(
    { _id: studentId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedStudent) {
    throw new ApiError(404, "Student not found with the provided ID.");
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      {student : updatedStudent},
      "Student details updated successfully"
    )
  );
});// tested Ok

//delete Student doc
const deleteStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required for deletion.");
  }

  const { _id, roles } = req.user;

  if (!roles || !_id) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (!roles.includes("admin")) {
    throw new ApiError(403, "Only admin can delete students.");
  }

  const deletedStudent = await Student.findByIdAndDelete(studentId);

  if (!deletedStudent) {
    throw new ApiError(404, "Student not found");
  }

  return res.status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Student deleted successfully from the database"
      )
    );
}); // tested OK

const getStudent = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required to fetch student");
  }

  const { _id, roles } = req.user;

  if (!_id || !roles) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { role } = req.body;

  if (!role) {
    throw new ApiError(400, "Role is required");
  }

  if (!roles.includes(role)) {
    throw new ApiError(403, "Unauthorized request - invalid role");
  }

  const student = await Student.findById(studentId).populate("parent", "name email");

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  
  if (role === "parent") {
    if (!student.parent.includes(_id)) {
      throw new ApiError(403, "Parents can only fetch their own children");
    }
  }

  
  return res.status(200).json(
    new ApiResponse(
      200,
      { student },
      "Student fetched successfully"
    )
  );
}); // tested Ok

const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, name, grade, sort = "asc" } = req.query;
  const { role } = req.body;

  if (!role || role === "parent") {
    throw new ApiError(401, "Invalid role provided");
  }

  const { _id, roles } = req.user;

  if (!roles.includes(role)) {
    throw new ApiError(403, "unauthorized access");
  }

  if (!_id) {
    throw new ApiError(403, "unauthorized access");
  }

  // build search filter
  let filter = {};
  if (name) filter.name = { $regex: name, $options: "i" };
  if (grade) filter.grade = grade;

  // pagination options
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { sid: sort === "asc" ? 1 : -1 },
  };

  const students = await Student.paginate(filter, options);

  return res
    .status(200)
    .json(new ApiResponse(200, students, "Students fetched successfully"));
}); // tested Ok

const getChildren = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, name, grade, sort = "asc" } = req.query;
  const { role } = req.body;

  if (!role || role !== "parent") {
    throw new ApiError(401, "Invalid role provided");
  }

  const { _id, roles } = req.user; // ✅ fixed

  if (!roles.includes("parent")) {
    throw new ApiError(403, "unauthorized access");
  }

  if (!_id) {
    throw new ApiError(403, "unauthorized access");
  }

  // 🔹 Use aggregation to fetch only the children of this parent
  const matchStage = { parent: _id }; // assumes student has `parent` field

  if (name) matchStage.name = { $regex: name, $options: "i" };
  if (grade) matchStage.grade = grade;

  const studentsAgg = await Student.aggregate([
    { $match: matchStage },
    { $sort: { sid: sort === "asc" ? 1 : -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit, 10) },
  ]);

  const totalCount = await Student.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: studentsAgg,
        totalDocs: totalCount,
        limit: parseInt(limit, 10),
        page: parseInt(page, 10),
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
      "Children fetched successfully"
    )
  );
}); // tested Ok


export { 
  adminRegister,
  userRegister,
  userLogin,
  userLogout,  
  addStudent,
  updateStudent,
  deleteStudent,
  getStudent,
  getStudents,
  getChildren,
};