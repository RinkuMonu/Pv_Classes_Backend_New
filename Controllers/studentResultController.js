const StudentResult = require("../Models/StudentResult");


// ✅ Create
exports.createResult = async (req, res) => {
    try {
        const { name, category, examType, marks, message  } = req.body;

        const result = new StudentResult({
            name,
            category,
            examType,
            marks,
            message,
        });

        await result.save();

        res.status(201).json({
            success: true,
            message: "Result added successfully",
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ✅ Get All
// exports.getAllResults = async (req, res) => {
//     try {
//         const results = await StudentResult.find().sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             count: results.length,
//             data: results,
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// ✅ Get All (with filter + search + pagination)
exports.getAllResults = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", category, examType } = req.query;

        // 🔍 Query build
        let query = {};

        // ✅ Search by name (case-insensitive)
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        // ✅ Filter by category
        if (category) {
            query.category = category;
        }

        // ✅ Filter by examType
        if (examType) {
            query.examType = examType;
        }

        // 📄 Pagination
        const skip = (page - 1) * limit;

        const results = await StudentResult.find(query)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit));

        // total count (for frontend pagination)
        const total = await StudentResult.countDocuments(query);

        res.status(200).json({
            success: true,
            count: results.length,
            total, // 🔥 total records
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: results,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ✅ Get Single
exports.getSingleResult = async (req, res) => {
    try {
        const result = await StudentResult.findById(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found",
            });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ✅ Update
exports.updateResult = async (req, res) => {
    try {
        const result = await StudentResult.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Result updated",
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// ✅ Delete
exports.deleteResult = async (req, res) => {
    try {
        const result = await StudentResult.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Result not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Result deleted",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// ✅ REPORT + AVERAGE 
exports.getReport = async (req, res) => {
    try {
        const report = await StudentResult.aggregate([
            {
                $group: {
                    _id: {
                        examType: "$examType",
                        category: "$category",
                    },
                    totalStudents: { $sum: 1 },
                    averageMarks: { $avg: "$marks" },
                    maxMarks: { $max: "$marks" },
                    minMarks: { $min: "$marks" },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};