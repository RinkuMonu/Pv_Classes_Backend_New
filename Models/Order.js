const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Courses purchase
    courses: [
        {
            course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }
        }
    ],

    // Books purchase
    books: [
        {
            book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true }
        }
    ],

    // Test Series purchase
    testSeries: [
        {
            test: { type: mongoose.Schema.Types.ObjectId, ref: "TestSeries", required: true }
        }
    ],
    combo: [
        {
            combo: { type: mongoose.Schema.Types.ObjectId, ref: "Combo", required: true }
        }
    ],
    paymentMethod: {
        type: String,
        enum: ["card", "upi", "netbanking"],
        required: true
    },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    paymentReference: {
        type: String
    },
    transactionId: { type: String },
    orderStatus: {
        type: String,
        enum: ["processing", "completed", "cancelled"],
        default: "processing"
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
