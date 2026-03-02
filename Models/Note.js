const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    // 🔗 Course Reference
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    noteTitle: {
      type: String,
      required: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    pdfUrl: {
      type: String,
      required: true
    },

    // 💰 Paid Logic
    isFree: {
      type: Boolean,
      default: false
    },

    price: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

// 🔗 Full PDF URL
NoteSchema.virtual("full_pdf").get(function () {
  return `${process.env.BASE_URL}/${this.pdfUrl}`;
});

NoteSchema.set("toJSON", { virtuals: true });
NoteSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Note", NoteSchema);