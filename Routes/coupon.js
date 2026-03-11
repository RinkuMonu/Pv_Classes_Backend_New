
const express = require("express");
const router = express.Router();
const couponController = require("../Controllers/coupon.js");
const verifyToken = require("../middleware/auth.js");

router.post("/", verifyToken, couponController.createCoupon);

router.get("/", verifyToken, couponController.getAllCoupons);

router.post("/validate",verifyToken, couponController.validateCoupon);

router.get("/:id", couponController.getCoupon);

router.put("/:id", verifyToken, couponController.updateCoupon);

router.delete("/:id", verifyToken, couponController.deleteCoupon);


module.exports = router;
