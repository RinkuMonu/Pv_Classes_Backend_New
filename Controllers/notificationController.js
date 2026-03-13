const Notification = require("../Models/Notification");
const UserPreference = require("../Models/UserPreference");

exports.createNotification = async (req, res) => {
    try {
        const { title, description, categoryId } = req.body;
        const adminId = req.user.id;

        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }

        const notification = new Notification({
            title,
            description,
            category: categoryId || null,
            createdBy: adminId,
        });

        await notification.save();

        let userPreferences;

        if (categoryId) {
            userPreferences = await UserPreference.find({
                $or: [
                    { categories: categoryId },
                    { categories: { $size: 0 } }
                ]
            }).populate("userId");
        } else {
            userPreferences = await UserPreference.find().populate("userId");
        }

        return res.status(201).json({
            message: "Notification created successfully",
            notification,
            sentToUsers: userPreferences.map((p) => p.userId?.email),
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error creating notification",
            error: error.message,
        });
    }
};

exports.setPreferences = async (req, res) => {
  try {
    const userId = req.user.id; // token se userId
    const { categoryIds } = req.body; // body se categoryIds lenge (array of category ObjectIds)

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: "At least one categoryId is required" });
    }

    let userPreference = await UserPreference.findOne({ userId });

    if (userPreference) {
      // 🔄 Update existing preference
      userPreference.categories = categoryIds;
      await userPreference.save();
    } else {
      // 🆕 Create new preference
      userPreference = new UserPreference({
        userId,
        categories: categoryIds,
      });
      await userPreference.save();
    }

    res.status(200).json({
      message: "Preferences set successfully",
      preferences: userPreference,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error setting preferences",
      error: error.message,
    });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // yeh aapke auth middleware se aayega

    // Step 1: Get user preferences
    const preferences = await UserPreference.findOne({ userId });

    if (!preferences || preferences.categories.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No preferences found for this user",
        notifications: [],
      });
    }

    // Step 2: Get notifications matching preferred categories
    const notifications = await Notification.find({
      category: { $in: preferences.categories },
    }).sort({ createdAt: -1 }); // latest first

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    // If you want, you can get query params for filtering or pagination
    const { categoryId, limit, page } = req.query;

    let filter = {};
    if (categoryId) {
      filter.category = categoryId;
    }

    // Pagination setup
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(pageSize)
      .populate("createdBy", "name email")
      .populate("category", "name slug description");


    const totalNotifications = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      total: totalNotifications,
      page: pageNum,
      pageSize,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
      error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params; // match your route

    if (!id) {
      return res.status(400).json({ message: "Notification ID is required" });
    }

    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully (hard delete)",
      deletedNotification,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
      error: error.message,
    });
  }
};