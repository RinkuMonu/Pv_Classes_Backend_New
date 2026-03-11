const Access = require("../Models/Access");
const Order = require("../Models/Order");
const Course = require("../Models/Course");
const Combo = require("../Models/Combo");

exports.checkAccess = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        // 1️⃣ Direct access check from Access collection (courses only)
        const directAccess = await Access.findOne({
            user: userId,
            course: itemId,
            validTill: { $gte: new Date() }
        });
        if (directAccess) {
            return res.status(200).json({ message: "Access granted (direct)", access: directAccess });
        }

        
        // 2️⃣ Check if user purchased this item directly or via combo
        const orders = await Order.find({
            user: userId,
            // orderStatus: "completed"
            paymentStatus: "paid"

        }).populate({
            path: "courses.course books.book testSeries.test",
            select: "_id comboId"
        });

        let hasAccess = false;

        for (const order of orders) {
            // Direct purchase
            if (order.courses.some(c => c.course._id.toString() === itemId)) {
                hasAccess = true;
                break;
            }
            if (order.books.some(b => b.book._id.toString() === itemId)) {
                hasAccess = true;
                break;
            }
            if (order.testSeries.some(t => t.test && t.test._id.toString() === itemId)) {
                hasAccess = true;
                break;
            }

            // Combo purchase via course
            for (const c of order.courses) {
                const course = await Course.findById(c.course._id).populate("comboId");
                if (course?.comboId) {
                    const combo = await Combo.findById(course.comboId)
                        .populate("books testSeries");
                    if (combo.books.some(b => b._id.toString() === itemId)) {
                        hasAccess = true;
                        break;
                    }
                    if (combo.testSeries.some(t => t && t._id.toString() === itemId)) {
                        hasAccess = true;
                        break;
                    }
                }
            }

            if (hasAccess) break;
        }

        if (!hasAccess) {
            return res.status(403).json({ message: "Access denied. Please purchase the item." });
        }

        res.status(200).json({ message: "Access granted" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};