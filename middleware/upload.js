  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");

  function upload(folderPath = "") {
    // Ensure the folder exists
    const uploadPath = path.join(__dirname, "../uploads", folderPath);
    fs.mkdirSync(uploadPath, { recursive: true });

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      }
    });

    return multer({ storage });
  }

  module.exports = upload;
