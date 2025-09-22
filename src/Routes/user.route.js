import { Router } from "express";
//admin controllers import
import {
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
  getUserDetails,
  updateUserDetails,
  deleteUserById,
  getUsersByRole,
  approveMultipleUsers,
  rejectMultipleUsers,
  deleteMultipleUsers,  
} from "../Controllers/user.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

// Routes for admin
router.route("/admin-register").post(adminRegister);
router.route("/register").post(userRegister);
router.route("/login").patch(userLogin);
router.route("/logout").patch(verifyJWT, userLogout);
router.route("/reset-password").patch(verifyJWT, resetPassword);
router.route("/update-user").patch(verifyJWT, updateUser);
router.route("/pending").post(verifyJWT, getPending);
router.route("/approve/:id").patch(verifyJWT, approveUser);
router.route("/refresh-token").patch(refreshAccessToken);
//get user details
// router.route("/me").get(verifyJWT, getUserDetails);

router.route("/get-user/:id").get(verifyJWT, getUserDetails);
router.route("/update-user/:id").patch(verifyJWT, updateUserDetails);
router.route("/delete-user/:id").delete(verifyJWT, deleteUserById);
router.route("/get-users-by-role").get(verifyJWT, getUsersByRole);
router.route("/approve-multiple").patch(verifyJWT, approveMultipleUsers);
router.route("/reject-multiple").patch(verifyJWT, rejectMultipleUsers);
router.route("/delete-multiple").delete(verifyJWT, deleteMultipleUsers);

router.route("/get-pending-count").post(verifyJWT, getPending);

export default router;
