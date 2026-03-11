const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    book_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookCategory",
      required: true,
    },
    book_subcategory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookSubCategory",
      required: true,
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    tag: {
      type: [String], // multiple tags
      default: [],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    book_description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount_price: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
    },
    language:{
      type:String,
      default:'hindi',
      required:true
    },

    // ✅ Key Features as array of objects
    book_key_features: [
      {
        title: { type: String, required: true }, // e.g. "Publication"
        value: { type: String, required: true }, // e.g. "Utkarsh Classes & Edutech Pvt. Ltd."
      }
    ]
  },
  { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
bookSchema.virtual("full_image").get(function () {
  if (Array.isArray(this.images) && this.images.length > 0) {
    const baseUrl = process.env.BASE_URL || "http://localhost:5006";
    return this.images.map(img => `${baseUrl}/uploads/book/${img}`);
  }
  return [];
});

module.exports = mongoose.model("Book", bookSchema);
