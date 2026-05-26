const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number },
  order: { type: Number, required: true },
  isFree: { type: Boolean, default: true },
  notes: [{ type: String }]
}, { _id: false });


const SubjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }, // optional
  videos: [VideoSchema]
}, { timestamps: true });

module.exports = mongoose.model("Subject", SubjectSchema);