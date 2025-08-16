import { Router } from "express";
import { healthCheck } from "../Controllers/healthCheck.controller.js";
import { userLogin } from "../Controllers/user.controller.js";

const router = Router();

router.route("/").get(healthCheck);

export default router;