const express = require("express");
const router = express.Router();
const bookController = require("../Controllers/bookController");
const upload = require("../middleware/upload");

// Create Book
router.post(
  "/",
  upload("book").array("images", 5), // function call + folder name pass
  bookController.createBook
);

// Get All Books
router.get("/", bookController.getAllBooks);
router.get("/category/:categoryId", bookController.getBooksByCategoryId);
router.get("/:id", bookController.getBookById);
router.put(
  "/:id",
  upload("book").array("images", 5),
  bookController.updateBook
);

router.delete("/:id", bookController.deleteBook);

module.exports = router;
