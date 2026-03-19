const axios = require("axios");

exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const payload = { email };

    const resp = await axios.post(
      "https://control.msg91.com/api/v5/email/validate",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          authkey: process.env.MSG91_AUTH_KEY, // 🔐 env use karo
        },
      }
    );

    const api = resp.data;
    const result = api?.data;

    console.log("✅ MSG91 Response:", api);

    const isDeliverable =
      result?.result?.result?.toString().toLowerCase() === "deliverable";

    const normalizedResponse = {
      success: true,
      emailvalid: isDeliverable,
      reason: {
        valid: result?.valid,
        valid_syntax: result?.valid_syntax,
        disposable: result?.disposable,
        role: result?.role,
        mx_found: result?.mx_found,
        smtp_check: result?.smtp_check,
        catch_all: result?.catch_all,
        did_you_mean: result?.did_you_mean || null,
      },
      message: isDeliverable
        ? "Valid email and deliverable"
        : "Invalid or undeliverable email",
    };

    return res.status(200).json(normalizedResponse);
  } catch (error) {
    console.error("❌ Email Verify Error:", error.response?.data || error);

    return res.status(500).json({
      success: false,
      message: "Email verification service error",
    });
  }
};