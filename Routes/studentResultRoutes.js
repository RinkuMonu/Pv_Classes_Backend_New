const express = require("express");
const router = express.Router();

const {
  createResult,
  getAllResults,
  getSingleResult,
  updateResult,
  deleteResult,
  getReport,
} = require("../Controllers/studentResultController");


// CRUD
router.post("/", createResult);
router.get("/", getAllResults);
router.get("/:id", getSingleResult);
router.put("/:id", updateResult);
router.delete("/:id", deleteResult);

// REPORT
router.get("/report/summary", getReport);

module.exports = router;