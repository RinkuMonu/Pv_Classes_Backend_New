
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

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    type: {
      type: String,
      enum: ["interview", "test"],
      default: "test"
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

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    paymentReference: {
      type: String
    },

    amount: {
      type: Number,
      default: 450
    },

    // NEW FIELD (user 2 subject select kar sakta hai)
    teachingSubjects: {
      type: [String],
      enum: ["maths", "sst", "hindi", "english", "science"],
      validate: {
        validator: function (value) {
          return value.length <= 2;
        },
        message: "Only 2 subjects allowed"
      }
    },

    // NEW FIELD (disability specialization)
    disabilitySpecialization: {
      type: String,
      enum: ["Intellectual-Disability"] // Intellectual Disability
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