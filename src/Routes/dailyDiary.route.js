import { Router } from "express";
import { verifyJWT } from "../Middelwares/auth.middelwares.js";
import {
    writeNew,
    editDiary,
    deleteDiary,
    getDiary,    
} from "../Controllers/dailyDairy.controller.js";


const router = Router();

router.route("/writeNew").post(verifyJWT,writeNew);
router.route("/update/:id").patch(verifyJWT,editDiary);
router.route("/delete/:id").delete(verifyJWT, deleteDiary);
router.route("/get-diary").get(verifyJWT, getDiary);

export default router;