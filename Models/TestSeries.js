// Models/TestSeries.js
const mongoose = require("mongoose");

/* ===== Question (embedded) ===== */
const optionSchema = new mongoose.Schema({
  key: { type: String, required: true },   // 'A','B','C','D'
  text: { type: String, required: true },
  image: { type: String }                  // optional
}, { _id: false });

const questionSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  type: { type: String, enum: ["mcq_single", "mcq_multi", "numeric"], required: true },
  statement: { type: String, required: true },
  statement_images: { type: [String], default: [] },

  options: { type: [optionSchema], default: [] }, // for mcq

  // server-only keys
  correctOptions: { type: [String], default: [] }, // e.g. ['A'] or ['A','C']
  correctNumeric: { type: Number },

  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },

  explanation: { type: String, default: "" },
  explanation_images: { type: [String], default: [] },

  subject: { type: String, trim: true },
  topic: { type: String, trim: true },

  is_active: { type: Boolean, default: true }
}, { _id: false, timestamps: true });

/* ===== Attempt (embedded – lightweight) ===== */
const responseSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptions: { type: [String], default: [] },
  numericAnswer: { type: Number },
  isCorrect: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  timeSpentSec: { type: Number, default: 0 },
  startedAt: { type: Date },
  answeredAt: { type: Date }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  test_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // embedded Test _id
  status: { type: String, enum: ["ongoing", "submitted"], default: "ongoing" },
  currentIndex: { type: Number, default: 0 },
  questionOrder: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
  responses: { type: [responseSchema], default: [] },

  // summary
  totalMarks: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  unattemptedCount: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
}, { _id: false });

/* ===== Test (embedded) ===== */
const embeddedTestSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },           // e.g. "Math Daily Quiz"
  subject: { type: String, required: true },         // "Math"
  type: { type: String, enum: ["full_test", "daily_quiz"], default: "daily_quiz" },
  perQuestionTimeSec: { type: Number, default: 30 }, // 30s/question
  durationSec: { type: Number, default: 0 },         // (optional) for full tests
  is_active: { type: Boolean, default: true },
  scheduleDate: { type: Date },                      // optional

  // embedded questions
  questions: { type: [questionSchema], default: [] }
}, { _id: false, timestamps: true });

/* ===== Your existing TestSeries root ===== */
const testSeriesSchema = new mongoose.Schema(
  {
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    title: { type: String, required: true, trim: true },
    title_tag: { type: String, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    discount_price: { type: Number, default: 0 },
    validity: { type: String, required: true },
    total_tests: { type: Number, default: 0 },
    subjects: [{ name: String, test_count: Number }],
    is_active: { type: Boolean, default: true },
    images: { type: [String], default: [] },

   is_free: {
  type: Boolean,
  default: true,  // ✅ default free
},
    // NEW: all tests/questions live here
    tests: { type: [embeddedTestSchema], default: [] },

    // NEW: attempts (optional retention — you can purge old)
    attempts: { type: [attemptSchema], default: [] }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
console.log("BASE_URL:", process.env.BASE_URL);
// Virtual for full image URLs
testSeriesSchema.virtual("full_image").get(function () {
  if (!this.images || this.images.length === 0) return [];
  const baseUrl = process.env.BASE_URL || "http://localhost:5006";
  return this.images.map(img => `${baseUrl}/uploads/testSeries/${img}`);
});

// Helper: sanitize question (hide answers)
testSeriesSchema.methods.sanitizeQuestion = function (q) {
  const obj = q.toObject ? q.toObject() : q;
  delete obj.correctOptions;
  delete obj.correctNumeric;
  delete obj.is_active;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("TestSeries", testSeriesSchema);
