const mongoose = require("mongoose");

const BookCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    image: {
      type: String, // sirf filename store hoga
      default: null
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
   }
);
BookCategorySchema.virtual("full_image").get(function () {
  if (this.image) {
    const baseUrl = process.env.BASE_URL || "http://localhost:5006";
    return `${baseUrl}/uploads/book/bookcategory/${this.image}`
  }
  return null;
});
module.exports = mongoose.model("BookCategory", BookCategorySchema);
