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
router.route("/pending").get(verifyJWT, getPending);
router.route("/approve/:id").patch(verifyJWT, approveUser);
router.route("/refresh-token").get(refreshAccessToken);

export default router;
