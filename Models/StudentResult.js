const mongoose = require("mongoose");

const studentResultSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["OBC", "SC", "ST", "GENERAL","EWS"],
      required: true,
    },
    examType: {
      type: String,
      enum: ["PRT", "TGT"],
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
       message: {   // ✅ NEW FIELD
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentResult", studentResultSchema);