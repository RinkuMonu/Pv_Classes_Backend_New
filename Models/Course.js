const mongoose = require("mongoose");

// ❓ FAQ Schema
const FAQSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true }
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    type: { type: String, enum: ["Test Series", "Course"], required: true },
    price: { type: Number, default: 0 },
    faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }],
    discountPrice: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    validity: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    language: { type: String, default: "English" },
    rating: { type: Number, default: 0 },
    learnersCount: { type: Number, default: 0 },
    shortDescription: { type: String },
    longDescription: { type: String },
    mainMotive: { type: String },
    topics: [{ type: String }],
    features: [{ type: String }],
    images: [{ type: String }],

    // ✅ Subjects reference
    subjects: [
  { type: mongoose.Schema.Types.ObjectId, ref: "Subject" }
],

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    comboId: { type: mongoose.Schema.Types.ObjectId, ref: "Combo" },

    faqs: [FAQSchema],

    pyqs: [{ type: mongoose.Schema.Types.ObjectId, ref: "PYQ" }]
  },
  { timestamps: true }
);

CourseSchema.virtual("full_image").get(function () {
  if (!this.images) return [];
  return this.images.map(
    (img) => `${process.env.BASE_URL}/uploads/course/${img}`
  );
});

CourseSchema.set("toJSON", { virtuals: true });
CourseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", CourseSchema);