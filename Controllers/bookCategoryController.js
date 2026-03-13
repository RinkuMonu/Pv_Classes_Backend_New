const BookCategory = require("../Models/BookCategory");

// ✅ Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    let image = null;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (req.file) {
      image = req.file.filename;
    }

    const existingCategory = await BookCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await BookCategory.create({
      name,
      description,
      status,
      image
    });

    res.status(201).json({
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get All Categories
// exports.getCategories = async (req, res) => {
//   try {
//     const categories = await BookCategory.find().sort({ createdAt: -1 });
//     res.status(200).json({ data: categories });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// ✅ Get All Categories (Search + Pagination)
exports.getCategories = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // 🔍 Search by category name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const totalCategories = await BookCategory.countDocuments(query);

    const categories = await BookCategory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories,
        limit
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    let updateData = { name, description, status };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const category = await BookCategory.findByIdAndUpdate(id, updateData, { new: true });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await BookCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
