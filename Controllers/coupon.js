
const { validationResult } = require("express-validator");
const Coupon = require("../Models/coupon.js");

// Create a new coupon
exports.createCoupon = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const couponData = req.body;
    const coupon = new Coupon(couponData);
    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let filter = {};
  if (status !== "all") {
    filter = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      usedBy: { $ne: userId },
    };
  }

  try {
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single coupon by ID
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.id })
          .populate("usedBy", "name email phone");


    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update coupon
exports.updateCoupon = async (req, res) => {
  const userId = req.user.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.body.startDate && req.body.endDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        });
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        $addToSet: { usedBy: userId },
      },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// exports.validateCoupon = async (req, res) => {
//   try {
//     const { code, userId, cartTotal } = req.body;
//     const now = new Date();

//     const coupon = await Coupon.findOne({
//       code: code.toUpperCase(),
//       isActive: true,
//       startDate: { $lte: now },
//       endDate: { $gte: now },
//     });

//     if (!coupon) {
//       return res.status(404).json({
//         success: false,
//         message: "Invalid or expired coupon",
//       });
//     }

//     // ✅ User already used
//     if (coupon.usedBy.includes(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: "You have already used this coupon",
//       });
//     }

//     // ✅ Minimum order amount
//     if (cartTotal < coupon.minOrderAmount) {
//       return res.status(400).json({
//         success: false,
//         message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
//       });
//     }

//     let discount = 0;

//     if (coupon.discountType === "percentage") {
//       discount = (cartTotal * coupon.discountValue) / 100;

//       if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
//         discount = coupon.maxDiscountAmount;
//       }

//     } else if (coupon.discountType === "fixed") {
//       discount = coupon.discountValue;
//     }

//     const finalPrice = cartTotal - discount;

//     res.status(200).json({
//       success: true,
//       message: "Coupon applied successfully",
//       discount,
//       finalPrice,
//       couponId: coupon._id
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user.id;
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon"
      });
    }

    const alreadyUsed = coupon.usedBy.some(
      (id) => id && id.toString() === userId.toString()
    );

    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        message: "You have already used this coupon"
      });
    }

    if (cartTotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minOrderAmount}`
      });
    }

    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (cartTotal * coupon.discountValue) / 100;

      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }

    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    const finalPrice = cartTotal - discount;

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      finalPrice,
      couponId: coupon._id
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};