// const multer = require("multer");
// const path = require("path");

// // Storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/notes/"); // make sure this folder exists
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// // Only allow PDF files
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "application/pdf") {
//     cb(null, true);
//   } else {
//     cb(new Error("Only PDF files are allowed"), false);
//   }
// };

// // Accept up to 5 files with field name "notes"
// const uploadNotes = multer({ storage, fileFilter });

// module.exports = uploadNotes;





const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure folders exist
if (!fs.existsSync("uploads/notes")) {
  fs.mkdirSync("uploads/notes", { recursive: true });
}
if (!fs.existsSync("uploads/videos")) {
  fs.mkdirSync("uploads/videos", { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "notes") {
      cb(null, "uploads/notes/");
    } else if (file.fieldname === "video") {
      cb(null, "uploads/videos/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Notes → only PDF
  if (file.fieldname === "notes") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for notes"), false);
    }
  }

  // Video → allow video formats
  else if (file.fieldname === "video") {
    const allowedVideos = [
      "video/mp4",
      "video/mkv",
      "video/webm",
    ];
    if (allowedVideos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  }

  else {
    cb(new Error("Invalid field name"), false);
  }
};

const uploadNotes = multer({
  storage,
  fileFilter,
  // limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

module.exports = uploadNotes;