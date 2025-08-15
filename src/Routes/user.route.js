import {Router} from "express";
//admin controllers import
import { adminRegister } from "../Controllers/admin.js";

const router = Router();

// Routes for admin
router.route("/admin-register").post(adminRegister);

export default router;