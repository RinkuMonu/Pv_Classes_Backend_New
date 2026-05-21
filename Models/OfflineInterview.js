
const mongoose = require("mongoose");

const OfflineInterviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    fatherName: {
      type: String
    },

    motherName: {
      type: String
    },

    email: {
      type: String
    },

    mobile: {
      type: String,
      required: true
    },

    exam: { type: String, required: true },

    type: {
      type: String,
      default: "interview"
    },

    rollNumber: {
      type: String
    },

    interviewType: { type: String, enum: ["TGT", "PRT", "DGT"], required: true },

    qualification: {
      type: String
    },

    city: {
      type: String
    },

    state: {
      type: String
    },


    groupNumber: {
      type: Number,
      default: null
    },

    scheduleDate: {
      type: Date
    },

    location: {
      type: String
    },

    notificationSent: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("OfflineInterview", OfflineInterviewSchema);