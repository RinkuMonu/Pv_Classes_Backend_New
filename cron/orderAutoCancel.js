const cron = require("node-cron");
const Order = require("../Models/Order");

// cron.schedule("* * * * *", async () => {
cron.schedule("*/2 * * * *", async () => {
  try {
    console.log("⏱ Checking expired orders...");

    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const expiredOrders = await Order.find({
      paymentStatus: "pending",
      transactionId: { $exists: false },
      createdAt: { $lte: cutoff }
    });

    if (expiredOrders.length === 0) return;

    for (const order of expiredOrders) {
      order.paymentStatus = "failed";
      order.orderStatus = "cancelled";

      await order.save();

      console.log(`❌ Order ${order._id} auto cancelled (timeout)`);
    }

  } catch (error) {
    console.error("CRON Error:", error.message);
  }
});