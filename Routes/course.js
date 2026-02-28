const express = require("express");
const router = express.Router();
const courseController = require("../Controllers/course");
const upload = require("../middleware/upload");
// const uploadVideo = require("../middleware/videoUpload"); // ✅ your Cloudinary video middleware

const uploadcourse = upload("course");

// Middleware to set subFolder before upload
function setCourseUploadFolder(req, res, next) {
    req.subFolder = "course"; // store in uploads/course
    next();
}

// Create course with file upload
router.post(
    "/",
    setCourseUploadFolder,
    uploadcourse.array("images", 5), // field name in form-data
    courseController.createCourse
);

router.post("/add-subject", courseController.addSubjectToCourse);

// Get all courses
router.get("/", courseController.getCourses);

// Get course by ID
router.get("/:id", courseController.getCourseById);

// Update course with file upload
router.put(
  "/:id",
  setCourseUploadFolder,
  uploadcourse.array("images", 5),   // field = "images"
  courseController.updateCourse
);

// Delete course 
router.delete("/:id", courseController.deleteCourse);

router.post(
    "/:courseId/upload-video",
    // uploadVideo.single("url"),
    courseController.uploadCourseVideo
);
router.put(
    "/:courseId/update-videos/:videoId",
    // uploadVideo.single("url"),
    courseController.updateCourseVideo
);

module.exports = router;
