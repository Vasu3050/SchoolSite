import { Router } from "express";
//admin controllers import
import {
  adminRegister,
  userLogin,
  userRegister,
  addStudent,
  userLogout,
  updateStudent,
  deleteStudent,
  getStudent,
  getStudents,
  getChildren,
} from "../Controllers/user.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

// Routes for admin
router.route("/admin-register").post(adminRegister);
router.route("/register").post(userRegister);
router.route("/login").patch(userLogin);
router.route("/logout").patch(verifyJWT, userLogout);
router.route("/add-student").post(verifyJWT, addStudent);
router.route("/update-student/:id").patch(verifyJWT, updateStudent);
router.route("/delete-student/:id").delete(verifyJWT, deleteStudent);
router.route("/get-student/:id").get(verifyJWT, getStudent);
router.route("/get-students").get(verifyJWT, getStudents);
router.route("/get-children").get(verifyJWT, getChildren);

export default router;
