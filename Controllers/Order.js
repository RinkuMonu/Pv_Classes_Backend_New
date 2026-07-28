const Order = require("../Models/Order");
const Access = require("../Models/Access");
const Course = require("../Models/Course");
const TestSeries = require("../Models/TestSeries");
const User = require("../Models/User");
const Book = require("../Models/Book");
const Combo = require("../Models/Combo");
const Coupon = require("../Models/coupon");



exports.checkout = async (req, res) => {

    try {
        const userId = req.user.id;

        const grouped = { courses: [], books: [], testSeries: [], combo: [] };

        req.body.cart.forEach(item => {
            if (item.itemType === "course") {
                grouped.courses.push({ course: item.itemId, quantity: item.quantity });
            } else if (item.itemType === "book") {
                grouped.books.push({
                    book: item.itemId,
                    quantity: item.quantity,
                    deliveryType: item.deliveryType || "pdf",
                    shippingAddress: item.shippingAddress || {}
                });
            } else if (item.itemType === "testSeries") {
                grouped.testSeries.push({ test: item.itemId, quantity: item.quantity });
            } else if (item.itemType === "combo") {
                grouped.combo.push({ combo: item.itemId, quantity: item.quantity });
            }
        });

        const { courses, books, testSeries, combo } = grouped;

        const { paymentMethod, couponId, shippingAddress } = req.body;

        if ((!courses.length && !books.length && !testSeries.length && !combo.length) || !paymentMethod) {
            return res.status(400).json({ message: "At least one item and all fields are required!" });
        }

        // if (books.length > 0) {
        //     const { name, phone, address, city, state, pincode } = shippingAddress || {};

        //     if (!name || !phone || !address || !city || !state || !pincode) {
        //         return res.status(400).json({
        //             message: "Complete shipping address is required for books"
        //         });
        //     }
        // }
for (const book of books) {
    if (book.deliveryType === "physical") {
        const {
            fullName,
            mobile,
            address,
            city,
            state,
            pincode,
        } = book.shippingAddress || {};

        if (
            !fullName ||
            !mobile ||
            !address ||
            !city ||
            !state ||
            !pincode
        ) {
            return res.status(400).json({
                success: false,
                message: "Complete shipping address is required for physical books"
            });
        }
    }
}
        if (!["card", "upi", "netbanking"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }

        // 🔹 Calculate Total Amount
        let totalAmount = 0;

        // ✅ Check if user already purchased anything
        const existingPaidOrder = await Order.findOne({
            user: userId,
            paymentStatus: "paid"
        });

        // for (const item of courses) {
        //     const course = await Course.findById(item.course);
        //     if (!course) continue;

        //     const price = course.price;
        //     totalAmount += price * (item.quantity || 1);
        // }

        const TARGET_COURSE_ID = "69ddc741e2b7eba525362ace";

        let discountApplied = false;

        for (const item of courses) {
            const course = await Course.findById(item.course);
            if (!course) continue;

            let price = course.price;

            // 🎯 Apply discount only if:
            // 1. User returning hai
            // 2. Course ID match karta hai
            // 3. Discount already apply nahi hua
            if (
                existingPaidOrder &&
                course._id.toString() === TARGET_COURSE_ID &&
                !discountApplied
            ) {
                price = price / 2;
                discountApplied = true;
            }

            totalAmount += price * (item.quantity || 1);
        }

        for (const item of testSeries) {

            const test = await TestSeries.findById(item.test);

            if (!test) continue;

            const price = test.price;
            totalAmount += price * (item.quantity || 1);
        }

        for (const item of combo) {
            const comboItem = await Combo.findById(item.combo);
            if (!comboItem) continue;

            const price = comboItem.price;
            totalAmount += price * (item.quantity || 1);
        }

        for (const item of books) {
            const book = await Book.findById(item.book);
            if (!book) continue;

            const price = book.discount_price;
            totalAmount += price * (item.quantity || 1);
        }

        // 🔹 Coupon Discount Calculate
        let discountAmount = 0;

        if (couponId) {

            const coupon = await Coupon.findById(couponId);

            if (coupon) {

                const now = new Date();

                if (
                    coupon.isActive &&
                    coupon.startDate <= now &&
                    coupon.endDate >= now &&
                    totalAmount >= coupon.minOrderAmount &&
                    !coupon.usedBy.includes(userId)
                ) {

                    if (coupon.discountType === "percentage") {

                        discountAmount = (totalAmount * coupon.discountValue) / 100;

                        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                            discountAmount = coupon.maxDiscountAmount;
                        }

                    } else {
                        discountAmount = coupon.discountValue;
                    }
                }
            }
        }

        const finalAmount = totalAmount - discountAmount;

        const lastOrder = await Order.findOne({
            serialNumber: { $exists: true, $ne: null }
        }).sort({ createdAt: -1 });

        let nextSerial = 1;

        if (lastOrder?.serialNumber) {
            const lastNumber = parseInt(lastOrder.serialNumber.replace("PV", ""), 10);
            nextSerial = lastNumber + 1;
        }

        const serialNumber = `PV${String(nextSerial).padStart(3, "0")}`;

        // Step 2: Create Order
        const order = new Order({
            user: userId,
            courses,
            books,
            testSeries,
            combo,
            shippingAddress,
            totalAmount: finalAmount,
            paymentMethod,
            coupon: couponId || null,
            discountAmount,
            paymentStatus: "pending",
            orderStatus: "processing",
            serialNumber
        });

        await order.save();

        res.status(201).json({
            message: "Order created successfully. Proceed to payment.",
            order
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const { userId, status, search, type, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (userId) filter.user = userId;

        // if (status) filter.orderStatus = status;

        // ✅ Status Filter
        if (status && ["processing", "shipped", "packed", "confirmed", "completed", "cancelled"].includes(status)) {
            filter.orderStatus = status;
        }


        // ✅ PRODUCT TYPE FILTER
        if (type === "course") {
            filter["courses.0"] = { $exists: true };
        }

        if (type === "book") {
            filter["books.0"] = { $exists: true };
        }

        if (type === "testSeries") {
            filter["testSeries.0"] = { $exists: true };
        }

        if (type === "combo") {
            filter["combo.0"] = { $exists: true };
        }


        const counts = {
            courses: await Order.countDocuments({ "courses.0": { $exists: true } }),
            books: await Order.countDocuments({ "books.0": { $exists: true } }),
            testSeries: await Order.countDocuments({ "testSeries.0": { $exists: true } }),
            combo: await Order.countDocuments({ "combo.0": { $exists: true } })
        };

        // ✅ SEARCH LOGIC
        if (search) {

            // Find users with matching name
            const users = await User.find({
                name: { $regex: search, $options: "i" }
            }).select("_id");

            const userIds = users.map((u) => u._id);

            filter.$or = [
                { transactionId: { $regex: search, $options: "i" } },
                { paymentMethod: { $regex: search, $options: "i" } },
                { user: { $in: userIds } } // 👤 customer name search
            ];
        }

        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .populate("user", "name email phone")
            .populate("courses.course", "title price thumbnail")
            .populate("books.book", "title price thumbnail")
            .populate("testSeries.test", "title price thumbnail")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders,
            counts,
            pagination: {
                totalOrders,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// exports.getOrderById = async (req, res) => {
//     try {
//         const { orderId } = req.params;

//         const order = await Order.findById(orderId)
//             .populate("user", "name email")
//             .populate("courses.course", "title price thumbnail")
//             .populate("books.book", "title price thumbnail")
//             .populate("testSeries.test", "title price thumbnail");

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         res.status(200).json({ success: true, order });
//     } catch (error) {
//         console.error("Error fetching order:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate("user", "name email phone")
            .populate("courses.course", "title price thumbnail")
            .populate("books.book", "title price thumbnail")
            .populate("testSeries.test", "title price thumbnail")
            .populate("combo.combo", "title price thumbnail"); // combo bhi populate

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.changeOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!["pending", "confirmed", "packed", "shipped", "completed", "processing", "cancelled"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: status },
            { new: true }
        )
            .populate("user", "name email phone")
            .populate("courses.course", "title price thumbnail")
            .populate("books.book", "title price thumbnail")
            .populate("testSeries.test", "title price thumbnail");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, message: "Order status updated", order });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// GET /order/is-returning
exports.isReturningUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const hasOrder = await Order.exists({
            user: userId,
            paymentStatus: "paid"
        });

        res.json({ isReturning: !!hasOrder });
    } catch (err) {
        res.status(500).json({ isReturning: false });
    }
};
