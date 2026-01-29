import mongoose from "mongoose";
import Class from "../Models/academicClass.model.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// CREATE CLASS (admin only)
export const createClass = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, section, academicYear } = req.body;

    if (!name || !section) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await Class.findOne({ name, section });
    if (exists) {
      return res.status(409).json({ message: "Class already exists" });
    }

    const newClass = await Class.create({
      name,
      section,
      academicYear,
    });

    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL CLASSES (admin only)
export const getAllClasses = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const classes = await Class.find();
    res.json(classes);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// GET SINGLE CLASS (read-only for all roles)
export const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!isValidId(classId)) {
      return res.status(400).json({ message: "Invalid class id" });
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(cls);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// ASSIGN CLASS TEACHERS (admin only)
export const assignClassTeachers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { classId } = req.params;
    const { teachers } = req.body;

    if (!isValidId(classId)) {
      return res.status(400).json({ message: "Invalid class id" });
    }

    const cls = await Class.findByIdAndUpdate(
      classId,
      { classTeachers: teachers },
      { new: true }
    );

    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(cls);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// ASSIGN SUBJECT TEACHERS (admin only)
export const assignSubjectTeachers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { classId } = req.params;
    const { subjects } = req.body;

    if (!isValidId(classId)) {
      return res.status(400).json({ message: "Invalid class id" });
    }

    const cls = await Class.findByIdAndUpdate(
      classId,
      { subjectTeachers: subjects },
      { new: true }
    );

    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(cls);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// GET TEACHER CLASSES
export const getMyClasses = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const classes = await Class.find({
      $or: [
        { classTeachers: req.user._id },
        { "subjectTeachers.teacher": req.user._id },
      ],
    });

    res.json(classes);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};