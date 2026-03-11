const axios = require("axios");
const Order = require("../Models/Order");

const Access = require("../Models/Access");
const Course = require("../Models/Course");
const Combo = require("../Models/Combo");
const Cart = require("../Models/Cart");
const Coupon = require("../Models/coupon");

// 🔹 Reference Generator
const generateReference = () => {
    return "RAJ" + Date.now() + Math.floor(Math.random() * 1000);
};

exports.initiatePayin = async (req, res) => {
    try {
        const { orderId } = req.body;

        // 1️⃣ Get Order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({ message: "Order already paid" });
        }

        // 2️⃣ Generate Reference
        const reference = generateReference();

        // 3️⃣ Prepare Payload
        const payload = {
            amount: order.totalAmount,
            category: "69098858833bc4bd990d6e22", // fixed
            email: "pmladlikabas@gmail.com",    // fixed
            reference: reference,
            userId: "6970f793e59ebf5abae7769e"     // fixed
        };

        // 4️⃣ Call PayIn API
        const response = await axios.post(
            "https://server.finuniques.in/api/v1/payment/payin",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.PAYIN_TOKEN}`
                }
            }
        );

        // 5️⃣ Save reference in Order
        order.paymentReference = reference;
        await order.save();

        return res.status(200).json({
            success: true,
            message: "PayIn initiated successfully",
            paymentData: response.data
        });

    } catch (error) {
        console.log("PayIn Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Payment initiation failed",
            error: error.response?.data || error.message
        });
    }
};


// exports.paymentCallback = async (req, res) => {
//     try {
//         console.log("Callback Body:", req.body);

//         const {
//             orderId,          // RAJ reference
//             responseCode,     // 100 = success
//             pgTransId,        // transaction id
//         } = req.body;

//         if (!orderId) {
//             return res.status(400).json({ message: "Invalid callback data" });
//         }

//         // 🔹 Find Order by paymentReference
//         const order = await Order.findOne({ paymentReference: orderId });
//         if (!order) {
//             return res.status(404).json({ message: "Order not found" });
//         }

//         // 🔹 Prevent duplicate processing
//         if (order.paymentStatus === "paid") {
//             return res.status(200).json({ message: "Already processed" });
//         }

//         // ✅ SUCCESS CASE
//         if (responseCode === "100") {

//             order.paymentStatus = "paid";
//             order.orderStatus = "completed";
//             order.transactionId = pgTransId;

//             await order.save();

//             const userId = order.user;

//             // 🔹 Grant Course Access
//             for (const c of order.courses) {
//                 const course = await Course.findById(c.course).populate("comboId");
//                 if (!course) continue;

//                 const validTill = course.validity
//                     ? new Date(Date.now() + parseInt(course.validity) * 24 * 60 * 60 * 1000)
//                     : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

//                 const existingAccess = await Access.findOne({
//                     user: userId,
//                     course: course._id
//                 });

//                 if (!existingAccess) {
//                     await Access.create({
//                         user: userId,
//                         course: course._id,
//                         validTill
//                     });
//                 }

//                 // 🔹 Combo Access
//                 if (course.comboId) {
//                     const combo = course.comboId;

//                     for (const bookId of combo.books || []) {
//                         const exist = await Access.findOne({
//                             user: userId,
//                             book: bookId
//                         });
//                         if (!exist) {
//                             await Access.create({
//                                 user: userId,
//                                 book: bookId,
//                                 validTill
//                             });
//                         }
//                     }

//                     for (const testId of combo.testSeries || []) {
//                         const exist = await Access.findOne({
//                             user: userId,
//                             testSeries: testId
//                         });
//                         if (!exist) {
//                             await Access.create({
//                                 user: userId,
//                                 testSeries: testId,
//                                 validTill
//                             });
//                         }
//                     }
//                 }
//             }

//             return res.status(200).json({
//                 message: "Payment successful & access granted"
//             });

//         } else {
//             // ❌ FAILED CASE
//             order.paymentStatus = "failed";
//             order.orderStatus = "cancelled";
//             await order.save();

//             return res.status(200).json({
//                 message: "Payment failed"
//             });
//         }

//     } catch (error) {
//         console.error("Callback Error:", error);
//         return res.status(500).json({
//             message: "Callback processing failed"
//         });
//     }
// };


exports.paymentCallback = async (req, res) => {
    try {
        console.log("Callback Body:", req.body);

        const {
            orderId,
            responseCode,
            pgTransId,
        } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "Invalid callback data" });
        }

        const order = await Order.findOne({ paymentReference: orderId });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.paymentStatus === "paid") {
            return res.status(200).json({ message: "Already processed" });
        }

        // ✅ SUCCESS CASE
        if (responseCode === "100") {

            // order.paymentStatus = "paid";
            // order.orderStatus = "completed";
            // order.transactionId = pgTransId;
            // await order.save();

            order.paymentStatus = "paid";
            order.transactionId = pgTransId;

            if (order.books && order.books.length > 0) {
                order.orderStatus = "confirmed"; // 📦 book order
            } else {
                order.orderStatus = "completed"; // 🎓 digital order
            }

            await order.save();

            // 🔹 MARK COUPON USED
            if (order.coupon) {
                await Coupon.findByIdAndUpdate(
                    order.coupon,
                    {
                        $addToSet: { usedBy: order.user }
                    }
                );
            }

            const userId = order.user;

            // =========================
            // 1️⃣ COURSE ACCESS
            // =========================
            for (const c of order.courses) {
                const course = await Course.findById(c.course).populate("comboId");
                if (!course) continue;

                const validTill = course.validity
                    ? new Date(Date.now() + parseInt(course.validity) * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

                const existingAccess = await Access.findOne({ user: userId, course: course._id });
                if (!existingAccess) {
                    await Access.create({ user: userId, course: course._id, validTill });
                }

                // Course ke combo items 
                if (course.comboId) {
                    const combo = course.comboId;

                    for (const bookId of combo.books || []) {
                        const exist = await Access.findOne({ user: userId, book: bookId });
                        if (!exist) {
                            await Access.create({ user: userId, book: bookId, validTill });
                        }
                    }

                    for (const testId of combo.testSeries || []) {
                        const exist = await Access.findOne({ user: userId, testSeries: testId });
                        if (!exist) {
                            await Access.create({ user: userId, testSeries: testId, validTill });
                        }
                    }
                }
            }

            // =========================
            // 2️⃣ STANDALONE BOOKS 
            // =========================
            for (const b of order.books) {
                const validTill = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

                const exist = await Access.findOne({ user: userId, book: b.book });
                if (!exist) {
                    await Access.create({ user: userId, book: b.book, validTill });
                }
            }

            // =========================
            // 3️⃣ STANDALONE TEST SERIES
            // =========================
            for (const t of order.testSeries) {
                const validTill = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

                const exist = await Access.findOne({ user: userId, testSeries: t.test });
                if (!exist) {
                    await Access.create({ user: userId, testSeries: t.test, validTill });
                }
            }

            // =========================
            // 4️⃣ DIRECT COMBO PURCHASE
            // =========================
            for (const c of order.combo) {
                const combo = await Combo.findById(c.combo);
                if (!combo) continue;

                const validTill = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

                // Combo ke books
                for (const bookId of combo.books || []) {
                    const exist = await Access.findOne({ user: userId, book: bookId });
                    if (!exist) {
                        await Access.create({ user: userId, book: bookId, validTill });
                    }
                }

                // Combo ke test series
                for (const testId of combo.testSeries || []) {
                    const exist = await Access.findOne({ user: userId, testSeries: testId });
                    if (!exist) {
                        await Access.create({ user: userId, testSeries: testId, validTill });
                    }
                }

                // Agar combo me courses bhi ho
                for (const courseId of combo.courses || []) {
                    const exist = await Access.findOne({ user: userId, course: courseId });
                    if (!exist) {
                        await Access.create({ user: userId, course: courseId, validTill });
                    }
                }
            }


            // 🔹 CLEAR CART DIRECTLY
            const cart = await Cart.findOne({ user: userId });
            if (cart && cart.items.length > 0) {
                await Cart.deleteOne({ user: userId });
            }


            return res.status(200).json({
                message: "Payment successful & all access granted"
            });

        } else {
            order.paymentStatus = "failed";
            order.orderStatus = "cancelled";
            order.transactionId = pgTransId;

            await order.save();

            return res.status(200).json({
                message: "Payment failed"
            });
        }

    } catch (error) {
        console.error("Callback Error:", error);
        return res.status(500).json({
            message: "Callback processing failed"
        });
    }
};
