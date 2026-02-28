// routes/checkoutRoutes.js
const express = require("express");

const authMiddleware = require("../middleware/auth.js");
const {
    changeOrderStatus,
    checkout,
    getAllOrders,
    getOrderById
} = require("../Controllers/Order.js");

const checkoutRouter = express.Router();

// create checkout ya create order
checkoutRouter.post("/", authMiddleware, checkout);

checkoutRouter.get("/get-all", getAllOrders);

checkoutRouter.get("/:orderId", getOrderById);

checkoutRouter.put("/:orderId/status", changeOrderStatus);

module.exports = checkoutRouter;
