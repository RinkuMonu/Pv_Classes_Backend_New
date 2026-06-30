require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../Models/Order");

const MONGODB_URI = process.env.MONGODB_URI;

async function updateOrderSerialNumbers() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI not found in .env");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    const orders = await Order.find().sort({ createdAt: 1 });

    for (let i = 0; i < orders.length; i++) {
      const serialNumber = `PV${String(i + 1).padStart(3, "0")}`;

      await Order.findByIdAndUpdate(orders[i]._id, {
        serialNumber,
      });

      console.log(`Updated ${orders[i]._id} -> ${serialNumber}`);
    }

    console.log("All order serial numbers updated successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error updating serial numbers:", error);
    process.exit(1);
  }
}

updateOrderSerialNumbers();