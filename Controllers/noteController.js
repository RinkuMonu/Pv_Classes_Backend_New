

// const Note = require("../Models/Note");
// const fs = require("fs");
// const path = require("path");


// // ================= CREATE NOTE =================
// exports.createNote = async (req, res) => {
//     try {
//         const { courseName, noteTitle, title, description } = req.body;

//         if (!courseName || !noteTitle || !title || !description || !req.file) {
//             return res.status(400).json({
//                 message: "courseName, noteTitle, title, description and PDF file are required"
//             });
//         }

//         const pdfUrl = `uploads/pdf/${req.file.filename}`;

//         const note = new Note({
//             courseName,
//             noteTitle,
//             title,
//             description,
//             pdfUrl
//         });

//         await note.save();

//         res.status(201).json(note);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };


// // ================= GET ALL NOTES (Grouped) =================
// exports.getNotes = async (req, res) => {
//     try {
//         const notes = await Note.find();

//         const grouped = {};

//         notes.forEach(note => {
//             if (!grouped[note.courseName]) {
//                 grouped[note.courseName] = {};
//             }

//             if (!grouped[note.courseName][note.noteTitle]) {
//                 grouped[note.courseName][note.noteTitle] = [];
//             }

//             grouped[note.courseName][note.noteTitle].push(note);
//         });

//         res.status(200).json(grouped);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };

// // ================= GET NOTES BY COURSE =================
// exports.getNotesByCourse = async (req, res) => {
//     try {
//         const { courseName } = req.params;

//         const notes = await Note.find({
//             courseName: { $regex: `^${courseName}$`, $options: "i" }
//         });

//         if (notes.length === 0) {
//             return res.status(404).json({ message: "No notes found for this course" });
//         }

//         // Group by noteTitle
//         const grouped = {};

//         notes.forEach(note => {
//             if (!grouped[note.noteTitle]) {
//                 grouped[note.noteTitle] = [];
//             }
//             grouped[note.noteTitle].push(note);
//         });

//         res.status(200).json({
//             courseName,
//             notes: grouped
//         });

//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };

// // ================= SEARCH NOTES =================
// exports.searchNotes = async (req, res) => {
//     try {
//         const { q } = req.query;

//         const notes = await Note.find({
//             $or: [
//                 { title: { $regex: q, $options: "i" } },
//                 { courseName: { $regex: q, $options: "i" } },
//                 { noteTitle: { $regex: q, $options: "i" } }
//             ]
//         });

//         res.status(200).json(notes);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };


// // ================= GET SINGLE NOTE =================
// exports.getNoteById = async (req, res) => {
//     try {
//         const note = await Note.findById(req.params.id);

//         if (!note) {
//             return res.status(404).json({ message: "Note not found" });
//         }

//         res.status(200).json(note);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };


// // ================= UPDATE NOTE =================
// exports.updateNote = async (req, res) => {
//     try {
//         const { courseName, noteTitle, title, description } = req.body;

//         const note = await Note.findById(req.params.id);

//         if (!note) {
//             return res.status(404).json({ message: "Note not found" });
//         }

//         if (courseName) note.courseName = courseName;
//         if (noteTitle) note.noteTitle = noteTitle;
//         if (title) note.title = title;
//         if (description) note.description = description;

//         if (req.file) {
//             if (note.pdfUrl) {
//                 const oldPath = path.join(__dirname, `../${note.pdfUrl}`);
//                 if (fs.existsSync(oldPath)) {
//                     fs.unlinkSync(oldPath);
//                 }
//             }

//             note.pdfUrl = `uploads/pdf/${req.file.filename}`;
//         }

//         await note.save();

//         res.status(200).json(note);
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };


// // ================= DELETE NOTE =================
// exports.deleteNote = async (req, res) => {
//     try {
//         const note = await Note.findById(req.params.id);

//         if (!note) {
//             return res.status(404).json({ message: "Note not found" });
//         }

//         if (note.pdfUrl) {
//             const filePath = path.join(__dirname, `../${note.pdfUrl}`);
//             if (fs.existsSync(filePath)) {
//                 fs.unlinkSync(filePath);
//             }
//         }

//         await note.deleteOne();

//         res.status(200).json({ message: "Note deleted successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Server Error", error: error.message });
//     }
// };




const Note = require("../Models/Note");
const Course = require("../Models/Course");
const fs = require("fs");
const path = require("path");


// ================= CREATE NOTE =================
exports.createNote = async (req, res) => {
  try {
    const { course, noteTitle, title, description, isFree, price } = req.body;

    if (!course || !noteTitle || !title || !description || !req.file) {
      return res.status(400).json({
        message: "course, noteTitle, title, description and PDF required"
      });
    }

    // Check course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: "Course not found" });
    }

    const note = new Note({
      course,
      noteTitle,
      title,
      description,
      isFree: isFree === "true" || isFree === true,
      price: isFree ? 0 : price,
      pdfUrl: `uploads/pdf/${req.file.filename}`
    });

    await note.save();

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ================= GET ALL NOTES =================
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ status: "active" })
      .populate("course", "title slug");

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ================= GET NOTES BY COURSE =================
exports.getNotesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const notes = await Note.find({
      course: courseId,
      status: "active"
    }).populate("course", "title slug");

    if (!notes.length) {
      return res.status(404).json({ message: "No notes found for this course" });
    }

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ================= SEARCH NOTES =================
exports.searchNotes = async (req, res) => {
  try {
    const { q } = req.query;

    const notes = await Note.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { noteTitle: { $regex: q, $options: "i" } }
      ],
      status: "active"
    }).populate("course", "title");

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ================= GET SINGLE NOTE =================
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("course", "title slug");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ================= UPDATE NOTE =================
exports.updateNote = async (req, res) => {
  try {
    const { course, noteTitle, title, description, isFree, price } = req.body;

    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (course) note.course = course;
    if (noteTitle) note.noteTitle = noteTitle;
    if (title) note.title = title;
    if (description) note.description = description;
    if (isFree !== undefined) note.isFree = isFree === "true" || isFree === true;
    if (price !== undefined) note.price = note.isFree ? 0 : price;

    if (req.file) {
      if (note.pdfUrl) {
        const oldPath = path.join(__dirname, `../${note.pdfUrl}`);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      note.pdfUrl = `uploads/pdf/${req.file.filename}`;
    }

    await note.save();

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// ================= DELETE NOTE =================
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (note.pdfUrl) {
      const filePath = path.join(__dirname, `../${note.pdfUrl}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await note.deleteOne();

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};