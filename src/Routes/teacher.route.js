import { Router } from "express";

import {
    getParents, 
} from "../Controllers/teacher.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

router.route("/get-parents/:id").get(verifyJWT, getParents);

export default router;
