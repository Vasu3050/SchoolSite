import { Router } from "express";

import {
    addStudent,
    updateStudent,
    deleteStudent,
    getStudent,
    getStudents,
  } from "../Controllers/students.controller.js";

import { verifyJWT } from "../Middelwares/auth.middelwares.js";

const router = Router();

router.route("/add-student").post(verifyJWT, addStudent);
router.route("/update-student/:id").patch(verifyJWT, updateStudent);
router.route("/delete-student/:id").delete(verifyJWT, deleteStudent);
router.route("/get-student/:id").get(verifyJWT, getStudent);
router.route("/get-students").get(verifyJWT, getStudents);

export default router;
