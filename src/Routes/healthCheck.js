import { Router } from "express";
import { healthCheck } from "../Controllers/healthCheck.js";

const router = Router();

router.route("/").get(healthCheck);

export default router;