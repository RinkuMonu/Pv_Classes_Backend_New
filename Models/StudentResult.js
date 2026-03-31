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
      enum: ["OBC", "SC", "ST", "GENERAL"],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentResult", studentResultSchema);