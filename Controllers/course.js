const Course = require("../Models/Course");
const Subject = require("../Models/subject");



// 📌 Create Course
exports.createCourse = async (req, res) => {
  try {
    const {
      title, slug, exam, type, author, language, mainMotive, topics, features,
      price, discount_price, isFree, validity,
      shortDescription, longDescription, status,
      comboId, videos, faculty, faqs
    } = req.body;

    let courseData = {
      title, slug, exam, type, author, language,
      mainMotive, price, discount_price,
      isFree, validity, shortDescription,
      longDescription, status, faculty
    };

    if (topics) courseData.topics = Array.isArray(topics) ? topics : topics.split(",");
    if (features) courseData.features = Array.isArray(features) ? features : features.split(",");

    if (req.files && req.files.length > 0) {
      courseData.images = req.files.map(file => `${file.filename}`);
    }

    // 👇 Only comboId
    if (comboId) {
      courseData.comboId = comboId;
    }

    if (videos) {
      courseData.videos = JSON.parse(videos);
    }

    // ✅ Handle FAQs (JSON array or string)
    if (faqs) {
      courseData.faqs = Array.isArray(faqs) ? faqs : JSON.parse(faqs);
    }

    const newCourse = new Course(courseData);
    await newCourse.save();

    res.status(201).json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    res.status(500).json({ message: "Error creating course", error: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const { title, type, status, viewAll, exam } = req.query;
    let filter = {};
    if (title) filter.title = { $regex: title, $options: "i" };
    if (exam) filter.exam = exam;
    if (type) filter.type = type;
    if (status) filter.status = status;

    let query = Course.find(filter)
      .populate("exam")
      .populate("faculty")
      .populate("author", "name experience profile_image_url specialization")
      .populate({
        path: "comboId",
        populate: [
          { path: "books", model: "Book" },
          { path: "testSeries", model: "TestSeries" },
          { path: "pyqs", model: "PYQ" }
        ]
      });

    if (viewAll !== "true") query = query.limit(50);

    let courses = await query;

    // ✅ Fetch subjects for each course
    courses = await Promise.all(
      courses.map(async course => {
        const subjects = await Subject.find({ course: course._id });

        // Final Price calculation
        let finalPrice = course.price || 0;
        if (course.comboId) {
          if (course.comboId.books) course.comboId.books.forEach(b => finalPrice += b.discount_price > 0 ? b.discount_price : b.price);
          if (course.comboId.testSeries) course.comboId.testSeries.forEach(ts => finalPrice += ts.discount_price > 0 ? ts.discount_price : ts.price);
          if (course.comboId.pyqs) course.comboId.pyqs.forEach(pq => finalPrice += pq.discount_price > 0 ? pq.discount_price : pq.price);
        }

        return { ...course.toObject(), subjects, finalPrice };
      })
    );

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("exam")
      .populate("faculty")
      .populate("author", "name experience profile_image_url specialization")
      .populate({
        path: "comboId",
        populate: [
          { path: "books", model: "Book" },
          { path: "testSeries", model: "TestSeries" },
          { path: "pyqs", model: "PYQ" }
        ]
      });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // ✅ Fetch subjects linked to this course
    const subjects = await Subject.find({ course: course._id });

    // 👇 Final Price calculation (same as before)
    let finalPrice = course.price || 0;
    if (course.comboId) {
      if (course.comboId.books) course.comboId.books.forEach(b => finalPrice += b.discount_price > 0 ? b.discount_price : b.price);
      if (course.comboId.testSeries) course.comboId.testSeries.forEach(ts => finalPrice += ts.discount_price > 0 ? ts.discount_price : ts.price);
      if (course.comboId.pyqs) course.comboId.pyqs.forEach(pq => finalPrice += pq.discount_price > 0 ? pq.discount_price : pq.price);
    }

    res.status(200).json({ ...course.toObject(), subjects, finalPrice });
  } catch (error) {
    res.status(500).json({ message: "Error fetching course", error: error.message });
  }
};

// 🔎 Global Course Search
exports.searchCourses = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query required" });
    }

    const courses = await Course.find({
      title: { $regex: q, $options: "i" },
      status: "active"
    })
      .populate("exam")
      .populate("faculty")
      .populate("author", "name profile_image_url")
      .limit(20);

    res.status(200).json(courses);

  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    let courseData = req.body;
    if (req.files && req.files.length > 0) {
      courseData.images = req.files.map(file => file.filename);
    }
    if (courseData.topics) {
      courseData.topics = Array.isArray(courseData.topics) ? courseData.topics : courseData.topics.split(",");
    }
    if (courseData.features) {
      courseData.features = Array.isArray(courseData.features) ? courseData.features : courseData.features.split(",");
    }

    // ✅ Handle FAQs
    if (courseData.faqs) {
      courseData.faqs = Array.isArray(courseData.faqs) ? courseData.faqs : JSON.parse(courseData.faqs);
    }

    const course = await Course.findByIdAndUpdate(req.params.id, courseData, { new: true });
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(400).json({ message: "Error updating course", error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
};



// **************** //
// ye niche vale 3 controller yha kam nhi aa rhe hai enko saprate subject controller me add kar diya hai 
//************* */

exports.uploadCourseVideo = async (req, res) => {
  try {
    const { title, shortDescription, longDescription, order, duration, url, isFree } = req.body;
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    // Validate order number
    const videoOrder = order ? Number(order) : course.videos.length + 1;
    const orderExists = course.videos.some(v => v.order === videoOrder);
    if (orderExists) {
      return res.status(400).json({ message: `Order ${videoOrder} already exists for this course` });
    }
    let videoUrl = null;
    let sourceType = null;

    if (req.file) {
      videoUrl = req.file.path;
      sourceType = "cloudinary";
    } else if (url) {
      videoUrl = url;
      sourceType = "youtube";
    }

    if (!videoUrl) {
      return res.status(400).json({ message: "Please upload a video or provide a YouTube URL" });
    }

    course.videos.push({
      title: title || `Part ${course.videos.length + 1}`,
      url: videoUrl,
      duration: duration ? Number(duration) : null,
      order: order ? Number(order) : course.videos.length + 1,
      isFree: isFree === "true",
      shortDescription: shortDescription,
      longDescription: longDescription,
      sourceType
    });

    course.videos.sort((a, b) => a.order - b.order);
    await course.save();

    res.status(200).json({ message: "Video added successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Video upload failed", error: error.message });
  }
};

exports.updateCourseVideo = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    const { title, description, shortDescription, longDescription, order, duration, url, isFree } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const video = course.videos.id(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // If order is being changed, validate uniqueness
    if (order && Number(order) !== video.order) {
      const orderExists = course.videos.some(v => v.order === Number(order));
      if (orderExists) {
        return res.status(400).json({ message: `Order ${order} already exists for this course` });
      }
      video.order = Number(order);
    }

    // File upload or YouTube link
    if (req.file) {
      video.url = req.file.path;
      video.sourceType = "cloudinary";
    } else if (url) {
      video.url = url;
      video.sourceType = "youtube";
    }

    // Update only provided fields
    if (title) video.title = title;
    if (description) video.description = description;
    if (shortDescription) video.shortDescription = shortDescription;
    if (longDescription) video.longDescription = longDescription;
    if (duration) video.duration = Number(duration);
    if (typeof isFree !== "undefined") video.isFree = isFree === "true" || isFree === true;

    // Sort by order after update
    course.videos.sort((a, b) => a.order - b.order);

    await course.save();

    res.status(200).json({ message: "Video updated successfully", course });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Video update failed", error: error.message });
  }
};

exports.addSubjectToCourse = async (req, res) => {
  try {
    const { courseId, subjectId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if subject already added
    if (!course.subjects) course.subjects = [];
    if (course.subjects.includes(subjectId)) {
      return res.status(400).json({ message: "Subject already added to this course" });
    }

    course.subjects.push(subjectId);
    await course.save();

    res.status(200).json({ message: "Subject added to course successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Error adding subject to course", error: error.message });
  }
};