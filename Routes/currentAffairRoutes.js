const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  createCategory,
  getCategories,
  createCurrentAffair,
  getCurrentAffairs,
  getCurrentAffairBySlug,
  updateCurrentAffair,
  deleteCurrentAffair
} = require("../Controllers/currentAffairController");

// Category Routes
router.post("/categories", createCategory);
router.get("/categories", getCategories);
router.put(
  "/:id",
  upload("currentaffair").single("image"),
  updateCurrentAffair
);
router.delete("/:id", deleteCurrentAffair);

router.post(
  "/",
  upload("currentaffair").single("image"), // upload to uploads/currentaffair
  createCurrentAffair
);
router.get("/", getCurrentAffairs);
router.get("/:slug", getCurrentAffairBySlug);

module.exports = router;