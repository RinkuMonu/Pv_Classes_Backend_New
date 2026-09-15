const express = require("express");
const finuniqueAuth = require("../middleware/finuniqueAuth");

const {
    initiatePayin,
    paymentCallback
} = require("../Controllers/Payment");

const router = express.Router();

router.post("/payin", finuniqueAuth, initiatePayin);

router.post("/payin/callback", paymentCallback);

module.exports = router;