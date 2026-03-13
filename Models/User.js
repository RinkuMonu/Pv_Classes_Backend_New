const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    password: { type: String },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: false
    },
    referral_code: { type: String, default: null },
    otp: { type: String },
    otpExpires: {
      type: Date,
      index: { expires: 300 }, // 300 sec = 5 min auto expire
    },

    // 🔑 Forgot password OTP
    resetPasswordOtp: { type: String },
    resetPasswordExpires: {
      type: Date,
      index: { expires: 600 }, // 600 sec = 10 min auto expire
    },

    address: { type: String },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "CourseCategory" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    district: { type: String },
    profile_image: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "teacher", "admin"],
      default: "y"
    },
    experience: { type: String },
    specialization: { type: String },
    sessionId: { type: String, default: null } // ✅ add this
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.virtual("profile_image_url").get(function () {
  if (this.profile_image) {
    return `${process.env.BASE_URL}/uploads/${this.profile_image}`;
  }
  return null;
});

module.exports = mongoose.model("User", UserSchema);
