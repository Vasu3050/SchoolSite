import { Router } from "express";

import {
    getChildren,
} from "../Controllers/parent.controller.js";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

router.route("/get-children").get(verifyJWT, getChildren);

export default router;
