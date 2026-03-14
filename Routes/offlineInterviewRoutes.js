// const express = require("express");
// const router = express.Router();

// const {
//   registerStudent,
//   getStudents,
//   createGroups,
//   scheduleInterview,
//   sendNotification
// } = require("../Controllers/offlineInterviewController");

// router.post("/register", registerStudent);

// router.get("/students", getStudents);

// router.post("/create-groups", createGroups);

// router.post("/schedule", scheduleInterview);

// router.post("/send-notification", sendNotification);


// module.exports = router;




const express = require("express");
const router = express.Router();

const {
  registerStudent,
  getStudents,
  createGroups,
  scheduleEvent,
  sendNotification
} = require("../Controllers/offlineInterviewController");

router.post("/register", registerStudent);

router.get("/students", getStudents);

router.post("/create-groups", createGroups);

router.post("/schedule", scheduleEvent);

router.post("/send-notification", sendNotification);

module.exports = router;