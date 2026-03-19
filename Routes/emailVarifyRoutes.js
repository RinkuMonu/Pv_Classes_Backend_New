const express = require("express");
const router = express.Router();

const { verifyEmail } = require("../Controllers/emailVarifyController");

// POST API
router.post("/verify-email", verifyEmail);

module.exports = router;