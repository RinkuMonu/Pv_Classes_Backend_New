const mongoose = require("mongoose");

const OfflineInterviewSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  email: {
    type: String
  },

  mobile: {
    type: String,
    required: true
  },

  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true
  },

  rollNumber: {
    type: String
  },

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

  interviewDate: {
    type: Date
  },

  interviewLocation: {
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