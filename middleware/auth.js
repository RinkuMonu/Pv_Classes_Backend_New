// const jwt = require("jsonwebtoken");
// const User = require("../Models/User");

// const authMiddleware = async (req, res, next) => {
//   const authHeader = req.headers["authorization"];

//   if (!authHeader) {
//     return res.status(401).json({ message: "Authorization header missing" });
//   }

//   const token = authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "Token missing" });
//   }

//   try {

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     // ✅ Only apply session restriction for students
//     if (user.role === "user") {

//       if (user.sessionId !== decoded.sessionId) {
//         return res.status(401).json({
//           message: "Your account is logged in on another device"
//         });
//       }

//     }

//     req.user = decoded;

//     next();

//   } catch (err) {
//     return res.status(403).json({ message: "Invalid or expired token" });
//   }
// };

// module.exports = authMiddleware;


const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const authMiddleware = async (req, res, next) => {
   console.log(
    "AUTH URL:",
    req.method,
    req.originalUrl
  );

  const authHeader = req.headers["authorization"];

  console.log("\n========== AUTH CHECK ==========");

  if (!authHeader) {
    console.log("AUTH HEADER: MISSING");

    return res.status(401).json({
      message: "Authorization header missing"
    });
  }

  const token = authHeader.split(" ")[1];

  console.log("TOKEN RECEIVED:", !!token);
  console.log(
    "TOKEN PREFIX:",
    token ? token.substring(0, 15) + "..." : "MISSING"
  );
  console.log("JWT SECRET PRESENT:", !!process.env.JWT_SECRET);

  if (!token) {
    console.log("TOKEN: MISSING");

    return res.status(401).json({
      message: "Token missing"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("JWT VERIFY: SUCCESS");
    console.log("DECODED USER ID:", decoded.id);
    console.log("DECODED SESSION ID:", decoded.sessionId);
    console.log("JWT EXP:", decoded.exp);

    const user = await User.findById(decoded.id);

    console.log("USER FOUND:", !!user);

    if (!user) {
      console.log("USER NOT FOUND");

      return res.status(401).json({
        message: "User not found"
      });
    }

    if (user.role === "user") {
      console.log("USER SESSION ID EXISTS:", !!user.sessionId);
      console.log(
        "SESSION MATCH:",
        user.sessionId === decoded.sessionId
      );

      if (user.sessionId !== decoded.sessionId) {
        console.log("SESSION MISMATCH");

        return res.status(401).json({
          message: "Your account is logged in on another device"
        });
      }
    }

    req.user = decoded;

    console.log("AUTH SUCCESS");
    console.log("==============================\n");

    next();

  } catch (err) {
  console.log("AUTH ERROR NAME:", err.name);
  console.log("AUTH ERROR MESSAGE:", err.message);

  // JWT related errors
  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.name === "NotBeforeError"
  ) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }

  // Database / server error
  return res.status(500).json({
    message: "Authentication service temporarily unavailable"
  });
}
};

module.exports = authMiddleware;