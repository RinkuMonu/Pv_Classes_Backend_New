const express = require("express");
const router = express.Router();
const bookController = require("../Controllers/bookController");
const upload = require("../middleware/upload");

// Create Book
// router.post(
//   "/",
//   upload("book").array("images", 5), // function call + folder name pass
//   bookController.createBook
// );

router.post(
  "/",
  upload("book").fields([
    { name: "images", maxCount: 5 },
    { name: "free_pdf", maxCount: 1 },
    { name: "paid_pdf", maxCount: 1 },
  ]),
  bookController.createBook
);

// Get All Books
router.get("/", bookController.getAllBooks);
router.get("/category/:categoryId", bookController.getBooksByCategoryId);
router.get("/:id", bookController.getBookById);

// router.put(
//   "/:id",
//   upload("book").array("images", 5),
//   bookController.updateBook
// );

router.put(
  "/:id",
  upload("book").fields([
    { name: "images", maxCount: 5 },
    { name: "free_pdf", maxCount: 1 },
    { name: "paid_pdf", maxCount: 1 },
  ]),
  bookController.updateBook
);

router.delete("/:id", bookController.deleteBook);

module.exports = router;
