const CurrentAffair = require("../Models/CurrentAffair");
const CurrentAffairCategory = require("../Models/CurrentAffairCategory");

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const category = new CurrentAffairCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await CurrentAffairCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Blog Post
exports.createCurrentAffair = async (req, res) => {
  try {
    let imagePath = "";
    if (req.file) {
      // 🔥 FIXED: path schema ke virtual se match ho
      // imagePath = `uploads/currentaffair/${req.file.filename}`;
      imagePath = `${req.file.filename}`;
    }

    const postData = {
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content,
      excerpt: req.body.excerpt || "",
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(",").map(tag => tag.trim()) : [],
      publishDate: req.body.publishDate || Date.now(),
      isFeatured: req.body.isFeatured === "true",
      status: req.body.status || "draft",
      image: imagePath
    };

    const post = new CurrentAffair(postData);
    await post.save();

    res.status(201).json({
      message: "Current affair created successfully",
      post
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Blogs (with advanced filters)
exports.getCurrentAffairs = async (req, res) => {
  try {
    const {
      category,
      search,
      latest,
      limit,
      status,
      tags,
      startDate,
      endDate
    } = req.query;

    let filter = {};

    // Optional status filter
    if (status) {
      filter.status = status;
    }

    // Category filter by slug
    if (category) {
      const cat = await CurrentAffairCategory.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    // Tags filter (case-insensitive match)
    if (tags) {
      const tagsArray = tags.split(",").map(tag => tag.trim().toLowerCase());
      filter.tags = {
        $in: tagsArray.map(tag => new RegExp(`^${tag}$`, "i"))
      };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.publishDate = {};
      if (startDate) filter.publishDate.$gte = new Date(startDate);
      if (endDate) filter.publishDate.$lte = new Date(endDate);
    }

    // Search filter (title, content, tags)
    if (search) {
      filter.$text = { $search: search };
    }

    let query = CurrentAffair.find(filter)
      .populate("category", "name slug");

    // Sorting
    if (latest === "true") {
      query = query.sort({ publishDate: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // Limit results
    if (limit) {
      query = query.limit(Number(limit));
    }

    const posts = await query.exec();
    res.json(posts);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get Single Blog Detail
exports.getCurrentAffairBySlug = async (req, res) => {
  try {
    const post = await CurrentAffair.findOne({ slug: req.params.slug, status: "published" })
      .populate("category", "name slug");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    let updateData = {
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content,
      excerpt: req.body.excerpt,
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(",").map(tag => tag.trim()) : [],
      publishDate: req.body.publishDate,
      isFeatured: req.body.isFeatured === "true",
      status: req.body.status,
    };

    // 🔥 If image is uploaded, overwrite
    if (req.file) {
      updateData.image = `${req.file.filename}`;
    }

    const updated = await CurrentAffair.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("category", "name slug");

    if (!updated) {
      return res.status(404).json({ message: "Current affair not found" });
    }

    res.json({
      message: "Current affair updated successfully",
      post: updated,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Delete Current Affair
exports.deleteCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;
    

    const deleted = await CurrentAffair.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Current affair not found" });
    }

    res.json({ message: "Current affair deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};