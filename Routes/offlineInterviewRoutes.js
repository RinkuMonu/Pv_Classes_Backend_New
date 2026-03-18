
const express = require("express");
const router = express.Router();

const {
  registerStudent,
  getStudents,
  createGroups,
  scheduleEvent,
  sendNotification,
  getStudentById,
  getStudentStats
} = require("../Controllers/offlineInterviewController");
const authMiddleware = require("../middleware/auth");

router.post("/register",authMiddleware, registerStudent);

router.get("/students", getStudents);

router.get("/student-stats", getStudentStats);

router.get("/student/:id", getStudentById);

router.post("/create-groups", createGroups);

router.post("/schedule", scheduleEvent);

router.post("/send-notification", sendNotification);

module.exports = router;