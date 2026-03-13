const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Order = require("../Models/Order");
const axios = require("axios");

const { v4: uuidv4 } = require("uuid");

// const generateToken = (user) => {
//   return jwt.sign(
//     { id: user._id, phone: user.phone },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );
// };

const generateToken = (user, sessionId) => {
  return jwt.sign(
    { id: user._id, phone: user.phone, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, phone, password, role, state, district, exam  } = req.body;

    if (!name || !phone || !password || !exam) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role agar body me diya hai to set ho jaayega, otherwise default "user" hi hoga
    const user = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || "user",
      state,
      district,
      exam
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role, // 👈 role send kiya
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// exports.login = async (req, res) => {
//   try {
//     const { phone, password } = req.body;

//     const user = await User.findOne({ phone });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     res.status(200).json({
//       message: "Login successful",
//       token: generateToken(user),
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Login failed", error: error.message });
//   }
// };


exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ generate new session
    const sessionId = uuidv4();

    user.sessionId = sessionId;
    await user.save();

    const token = generateToken(user, sessionId);

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};


exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP temporarily in user DB
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    // Send OTP via Fast2SMS
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your OTP is ${otp}`,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
      }
    );

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // Send OTP via Fast2SMS
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your password reset OTP is ${otp}`,
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
      }
    );

    res.status(200).json({ message: "OTP sent for password reset" });
  } catch (error) {
    res.status(500).json({ message: "Error in forgot password", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};

exports.getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User data fetched successfully",
      data: user,
    });

  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode } = req.body; // form-data text fields
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;
    if (req.file) {
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/profile_image/${req.file.filename}`;
      updateData.profile_image = req.file.filename;
      updateData.profile_image_url = fileUrl;
    }


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// exports.getAllUserData = async (req, res) => {
//   try {
//     const users = await User.find(); // fetch all users
//     if (!users.length) {
//       return res.status(404).json({ message: "No users found" });
//     }
//     return res.status(200).json({
//       message: "Users fetched successfully",
//       data: users,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.getAllUserData = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";


    const skip = (page - 1) * limit;

    let filter = {};

    // 🔎 Search by user name
    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive
    }

    const totalUsers = await User.countDocuments(filter);

    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.body; // or req.params.userId if you want

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle status
    user.status = user.status === "active" ? "inactive" : "active";

    await user.save();

    return res.status(200).json({
      message: `User status updated to ${user.status}`,
      data: user,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// exports.getMyPurchases = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const orders = await Order.find({
//       user: userId,
//       orderStatus: "completed"
//     })
//       .populate("courses.course")
//       .populate("books.book")
//       .populate("testSeries.test")
//       .sort({ createdAt: -1 });

//     const purchasedCourses = [];
//     const purchasedBooks = [];
//     const purchasedTestSeries = [];

//     orders.forEach(order => {
//       // 🟢 Courses
//       order.courses.forEach(c => {
//         if (c.course) {
//           purchasedCourses.push(
//             c.course
//           );
//         }
//       });

//       // 🟢 Books
//       order.books.forEach(b => {
//         if (b.book) {
//           purchasedBooks.push(
//             b.book
//           );
//         }
//       });

//       // 🟢 Test Series
//       order.testSeries.forEach(t => {
//         if (t.test) {
//           purchasedTestSeries.push(
//             t.test
//           );
//         }
//       });
//     });

//     res.status(200).json({
//       success: true,
//       items: { purchasedCourses, purchasedBooks, purchasedTestSeries }
//     });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


exports.getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({
      user: userId,
      // orderStatus: "completed"
      paymentStatus: "paid" // ✅ payment success hona chahiye

    })
      .populate({
        path: "courses.course",
        populate: { path: "comboId", populate: ["books", "testSeries", "pyqs"] } // ✅ combo ke andar books aur test series bhi

      })
      .populate("books.book")
      .populate("testSeries.test")
      .sort({ createdAt: -1 });

    const purchasedCourses = [];
    const purchasedBooks = [];
    const purchasedTestSeries = [];

    orders.forEach(order => {
      // 🟢 Courses
      order.courses.forEach(c => {
        if (c.course) {
          purchasedCourses.push(c.course);

          // ✅ Agar course me combo hai to uske items bhi add karo
          if (c.course.comboId) {
            const combo = c.course.comboId;

            // Combo books
            if (combo.books?.length > 0) {
              combo.books.forEach(b => {
                if (b) purchasedBooks.push(b);
              });
            }

            // Combo testSeries
            if (combo.testSeries?.length > 0) {
              combo.testSeries.forEach(t => {
                if (t) purchasedTestSeries.push(t);
              });
            }
          }
        }
      });

      // 🟢 Standalone Books
      // order.books.forEach(b => {
      //   if (b.book) purchasedBooks.push(b.book);
      // });

      // 🟢 Standalone Books
      order.books.forEach(b => {
        if (b.book) {
          purchasedBooks.push({
            ...b.book.toObject(),
            orderStatus: order.orderStatus,
            orderId: order._id,
            paymentStatus: order.paymentStatus,
            shippingAddress: order.shippingAddress
          });
        }
      });

      // 🟢 Standalone Test Series
      order.testSeries.forEach(t => {
        if (t.test) purchasedTestSeries.push(t.test);
      });
    });

    res.status(200).json({
      success: true,
      items: { purchasedCourses, purchasedBooks, purchasedTestSeries }
    });

  } catch (error) {
    console.error("❌ Error in getMyPurchases:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.getUsersByExam = async (req, res) => {
  try {

    const { examId } = req.params;

    const users = await User.find({ exam: examId });

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};