const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  sendOtp,
  register,
  login,
  forgotPassword,
  resetPassword,
  updateUser,
  getUserData,
  getAllUserData,
  updateUserStatus,
  getMyPurchases,
  getUsersByExam
} = require("../Controllers/userController");

router.post("/get-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/getUser", auth, getUserData);
router.get("/getAllUser", auth, getAllUserData);
router.put("/updateStatus", auth, updateUserStatus);

router.get("/my-purchases", auth, getMyPurchases);

router.get("/exam/:examId", getUsersByExam);

const path = require("path");

router.put(
  "/updateUser",
  auth,
  (req, res, next) => {
    req.subFolder = "profile_image";
    next();
  },
  upload().single("profile_image"),
  updateUser
);


module.exports = router;
