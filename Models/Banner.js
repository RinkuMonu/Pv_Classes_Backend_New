const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    // referenceWebsite: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Websitelist",
    //     // required: true,
    // },
    bannerName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "both"],
      default: "both",
    },
    images: {
      type: [String],
      required: true,
    },
    position: {
      type: String,
      enum: [
        "homepage-top",
        "homepage-bottom",
        "sidebar",
        "footer",
        "custom",
      ],
      default: "homepage-top",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bannerSchema.virtual("full_image").get(function () {
  if (this.images) {
    const baseUrl = process.env.BASE_URL || "http://localhost:5006";
    return `${baseUrl}/uploads/banner/${this.images}`;
  }
  return null;
});

const Banner = mongoose.model("banner", bannerSchema);

module.exports = Banner;
