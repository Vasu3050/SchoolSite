import {Router} from "express";
//admin controllers import
import { adminRegister, userLogin,userRegister,addStudent } from "../Controllers/user.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

// Routes for admin
router.route("/admin-register").post(adminRegister);
router.route("/register").post(userRegister);
router.route("/login").patch(userLogin);
router.route("/add-student").post(verifyJWT,addStudent);


export default router;