// const mongoose = require('mongoose');

// const NoteSchema = new mongoose.Schema({
//     title: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//     },
//     description: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     pdfUrl: {
//         type: String,
//         required: true,
//         trim: true,
//     }
// }, { timestamps: true });

// module.exports = mongoose.model('Note', NoteSchema);



const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        trim: true,
    },
    noteTitle: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    pdfUrl: {
        type: String,
        required: true,
        trim: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);