const express = require("express");
const router = express.Router();
const subjectController = require("../Controllers/subject");
const uploadNotes = require("../middleware/notesMiddleware");
const uploadVideo = require("../middleware/videoMiddleware");

// Subject CRUD
router.post("/", subjectController.createSubject); // Create Subject
router.get("/", subjectController.getAllSubjects); // Get all subjects

router.put("/:subjectId", subjectController.updateSubject); // Update subject
router.delete("/:subjectId", subjectController.deleteSubject); // Delete subject

router.post("/assign", subjectController.assignSubjectToCourse); // Assign subject to course
router.get("/course/:courseId", subjectController.getSubjectsByCourse); // Get subjects by course

// Video + Notes
// router.post(
//   "/:subjectId/videos",
//   uploadNotes.array("notes", 5), // field name = "notes"
//   subjectController.uploadVideoWithNotes
// );

router.post(
  "/:subjectId/videos",
  uploadNotes.fields([
    { name: "video", maxCount: 1 },
    { name: "notes", maxCount: 5 }
  ]),
  subjectController.uploadVideoWithNotes
);


// router.put(
//   "/:subjectId/videos/:videoIndex",
//   uploadNotes.array("notes", 5),
//   subjectController.updateVideoSimple
// );

router.put(
  "/:subjectId/videos/:videoIndex",
  uploadNotes.fields([
    { name: "video", maxCount: 1 },
    { name: "notes", maxCount: 5 }
  ]),
  subjectController.updateVideoSimple
);


router.delete(
  "/:subjectId/videos/:videoIndex",
  subjectController.deleteVideo
);



module.exports = router;