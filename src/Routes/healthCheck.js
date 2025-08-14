import { Router } from "express";
import { healthCheck } from "../Controllers/healthCheck";

const router = Router();

router.route("/").get(healthCheck);

export default router;