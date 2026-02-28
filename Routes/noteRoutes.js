// const express = require('express');
// const router = express.Router();
// const noteController = require('../Controllers/noteController');
// const upload = require('../middleware/upload');

// // Create Note (Upload PDF to uploads/pdf)
// router.post('/', upload("pdf").single("pdf"), noteController.createNote);

// // Get all Notes
// router.get('/', noteController.getNotes);

// // ✅ Search Notes
// router.get('/search', noteController.searchNotes);

// // Get single Note
// router.get('/:id', noteController.getNoteById);

// // Update Note
// router.put('/:id', upload("pdf").single("pdf"), noteController.updateNote);

// // Delete Note
// router.delete('/:id', noteController.deleteNote);

// module.exports = router;



const express = require('express');
const router = express.Router();
const noteController = require('../Controllers/noteController');
const upload = require('../middleware/upload');

// Create Note
router.post('/', upload("pdf").single("pdf"), noteController.createNote);

// Get All Notes (Grouped)
router.get('/', noteController.getNotes);

// Get Notes By Course
router.get('/course/:courseName', noteController.getNotesByCourse);

// Search Notes
router.get('/search', noteController.searchNotes);

// Get Single Note
router.get('/:id', noteController.getNoteById);

// Update Note
router.put('/:id', upload("pdf").single("pdf"), noteController.updateNote);

// Delete Note
router.delete('/:id', noteController.deleteNote);

module.exports = router;