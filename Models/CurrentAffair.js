const mongoose = require("mongoose");

const CurrentAffairSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "CurrentAffairCategory", required: true },
  image: { type: String },
  tags: [{ type: String }],
  publishDate: { type: Date, default: Date.now },
  isFeatured: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
}, { timestamps: true });

// 🔍 Full text search
CurrentAffairSchema.index({ title: "text", content: "text", tags: "text" });

// 🖼️ Virtual field for full image URL
CurrentAffairSchema.virtual("full_image").get(function () {
  if (this.image) {
    const baseUrl = process.env.BASE_URL || "http://localhost:5006";
    return `${baseUrl}/uploads/currentAffairs/${this.image}`;
  }
  return null;
});

// Include virtuals when converting to JSON / Object
CurrentAffairSchema.set("toJSON", { virtuals: true });
CurrentAffairSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CurrentAffair", CurrentAffairSchema);