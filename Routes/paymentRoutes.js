const express = require("express");
const authMiddleware = require("../middleware/auth");
const { initiatePayin, paymentCallback } = require("../Controllers/Payment");

const router = express.Router();

router.post("/payin", authMiddleware, initiatePayin);

router.post("/payin/callback", paymentCallback);

module.exports = router;