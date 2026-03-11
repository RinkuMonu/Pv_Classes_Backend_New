const Order = require("../Models/Order");
const Access = require("../Models/Access");
const Course = require("../Models/Course");
const User = require("../Models/User");


// exports.checkout = async (req, res) => {

//     try {
//         const userId = req.user.id;
//         // Step 1: Transform cart by itemType
//         const grouped = { courses: [], books: [], testSeries: [], combo: [] };
//         req.body.cart.forEach(item => {
//             if (item.itemType === "course") {
//                 grouped.courses.push({ course: item.itemId, quantity: item.quantity });
//             } else if (item.itemType === "book") {
//                 grouped.books.push({ book: item.itemId, quantity: item.quantity });
//             } else if (item.itemType === "testSeries") {
//                 grouped.testSeries.push({ test: item.itemId, quantity: item.quantity });
//             } else if (item.itemType === "combo") {
//                 grouped.combo.push({ combo: item.itemId, quantity: item.quantity });
//             }
//         });

//         const { courses, books, testSeries, combo } = grouped;
//         const { paymentMethod, totalAmount } = req.body;


//         if ((!courses.length && !books.length && !testSeries.length && !combo.length) || !paymentMethod || !totalAmount) {
//             return res.status(400).json({ message: "At least one item and all fields are required!" });
//         }

//         if (!["card", "upi", "netbanking"].includes(paymentMethod)) {
//             return res.status(400).json({ message: "Invalid payment method" });
//         }

//         // Step 2: Create Order
//         const order = new Order({
//             user: userId,
//             courses,
//             books,
//             testSeries,
//             combo,
//             totalAmount: totalAmount,
//             paymentMethod,
//             paymentStatus: "pending",
//             orderStatus: "processing"
//         });
//         await order.save();
//         // Step 3: Grant Access for Courses (+ Combo)
//         for (const c of courses) {
//             const course = await Course.findById(c.course).populate("comboId");
//             if (!course) continue;

//             const validTill = course.validity
//                 ? new Date(Date.now() + parseInt(course.validity) * 24 * 60 * 60 * 1000)
//                 : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

//             // Standalone course access
//             const existingAccessCourse = await Access.findOne({ user: userId, course: course._id });
//             if (!existingAccessCourse) {
//                 await Access.create({ user: userId, course: course._id, validTill });
//             }

//             // Combo items access
//             if (course.comboId) {
//                 const combo = course.comboId;

//                 if (combo.books?.length > 0) {
//                     for (const bookId of combo.books) {
//                         const existingBookAccess = await Access.findOne({ user: userId, book: bookId });
//                         if (!existingBookAccess) {
//                             await Access.create({ user: userId, book: bookId, validTill });
//                         }
//                     }
//                 }

//                 if (combo.testSeries?.length > 0) {
//                     for (const testId of combo.testSeries) {
//                         const existingTestAccess = await Access.findOne({ user: userId, testSeries: testId });
//                         if (!existingTestAccess) {
//                             await Access.create({ user: userId, testSeries: testId, validTill });
//                         }
//                     }
//                 }
//             }
//         }

//         // Step 4: Standalone Books
//         for (const b of books) {
//             const validTill = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
//             const existingBookAccess = await Access.findOne({ user: userId, book: b.book });
//             if (!existingBookAccess) {
//                 await Access.create({ user: userId, book: b.book, validTill });
//             }
//         }

//         // Step 5: Standalone TestSeries
//         for (const t of testSeries) {
//             const validTill = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
//             const existingTestAccess = await Access.findOne({ user: userId, testSeries: t.test });
//             if (!existingTestAccess) {
//                 await Access.create({ user: userId, testSeries: t.test, validTill });
//             }
//         }

//         res.status(201).json({
//             message: "Checkout successful, order created, access granted!",
//             order
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: error.message });
//     }
// };


exports.checkout = async (req, res) => {

    try {
        const userId = req.user.id;
        // Step 1: Transform cart by itemType 
        const grouped = { courses: [], books: [], testSeries: [], combo: [] };
        req.body.cart.forEach(item => {
            if (item.itemType === "course") {
                grouped.courses.push({ course: item.itemId, quantity: item.quantity });
            } else if (item.itemType === "book") {
                grouped.books.push({ book: item.itemId, quantity: item.quantity });
            } else if (item.itemType === "testSeries") {
                grouped.testSeries.push({ test: item.itemId, quantity: item.quantity });
            } else if (item.itemType === "combo") {
                grouped.combo.push({ combo: item.itemId, quantity: item.quantity });
            }
        });

        const { courses, books, testSeries, combo } = grouped;
        const { paymentMethod, totalAmount, couponId, discountAmount, shippingAddress } = req.body;


        if ((!courses.length && !books.length && !testSeries.length && !combo.length) || !paymentMethod || !totalAmount) {
            return res.status(400).json({ message: "At least one item and all fields are required!" });
        }


        if (books.length > 0) {
            const { name, phone, address, city, state, pincode } = shippingAddress || {};

            if (!name || !phone || !address || !city || !state || !pincode) {
                return res.status(400).json({
                    message: "Complete shipping address is required for books"
                });
            }
        }

        if (!["card", "upi", "netbanking"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }

        // Step 2: Create Order
        const order = new Order({
            user: userId,
            courses,
            books,
            testSeries,
            combo,
            shippingAddress,
            totalAmount: totalAmount,
            paymentMethod,
            coupon: couponId || null,
            discountAmount: discountAmount || 0,
            paymentStatus: "pending",
            orderStatus: "processing"
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


// exports.getAllOrders = async (req, res) => {
//     try {
//         const { userId, status } = req.query;

//         const filter = {};
//         if (userId) filter.user = userId;
//         if (status) filter.orderStatus = status;

//         const orders = await Order.find(filter)
//             .populate("user", "name email")
//             .populate("courses.course", "title price thumbnail")
//             .populate("books.book", "title price thumbnail")
//             .populate("testSeries.test", "title price thumbnail");

//         res.status(200).json({ success: true, orders });
//     } catch (error) {
//         console.error("Error fetching orders:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };


exports.getAllOrders = async (req, res) => {
    try {
        const { userId, status, search, type, page = 1, limit = 10 } = req.query;

        const filter = {};
        if (userId) filter.user = userId;

        // if (status) filter.orderStatus = status;

        // ✅ Status Filter
        if (status && ["processing", "shipped","packed", "confirmed" , "completed", "cancelled"].includes(status)) {
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
            .populate("user", "name email")
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

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate("user", "name email")
            .populate("courses.course", "title price thumbnail")
            .populate("books.book", "title price thumbnail")
            .populate("testSeries.test", "title price thumbnail");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
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
            .populate("user", "name email")
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
