// const OfflineInterview = require("../Models/OfflineInterview");
// const axios = require("axios");


// exports.registerStudent = async (req, res) => {

//     try {

//         const {
//             name,
//             email,
//             mobile,
//             exam,
//             rollNumber,
//             qualification,
//             city,
//             state
//         } = req.body;

//         if (!name || !mobile || !exam) {
//             return res.status(400).json({ message: "Required fields missing" });
//         }

//         const student = new OfflineInterview({
//             name,
//             email,
//             mobile,
//             exam,
//             rollNumber,
//             qualification,
//             city,
//             state
//         });

//         await student.save();

//         res.json({
//             message: "Form submitted successfully",
//             data: student
//         });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }

// };


// exports.getStudents = async (req, res) => {

//     try {

//         const students = await OfflineInterview
//             .find()
//             .populate("exam")
//             .sort({ createdAt: -1 });

//         res.json(students);

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }

// };


// exports.createGroups = async (req, res) => {
//     try {

//         const { groupSize } = req.body;

//         if (!groupSize || groupSize <= 0) {
//             return res.status(400).json({
//                 message: "groupSize is required and must be greater than 0"
//             });
//         }

//         const students = await OfflineInterview
//             .find({ groupNumber: null })
//             .sort({ createdAt: 1 });

//         if (students.length === 0) {
//             return res.json({
//                 message: "No students available for grouping"
//             });
//         }

//         // last group number check karo
//         const lastGroup = await OfflineInterview
//             .findOne({ groupNumber: { $ne: null } })
//             .sort({ groupNumber: -1 });

//         let group = lastGroup ? lastGroup.groupNumber + 1 : 1;

//         for (let i = 0; i < students.length; i += groupSize) {

//             const batch = students.slice(i, i + groupSize);

//             for (const student of batch) {
//                 student.groupNumber = group;
//                 await student.save();
//             }

//             group++;
//         }

//         res.json({
//             message: "Groups created successfully",
//             totalStudents: students.length,
//             groupSize
//         });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// exports.scheduleInterview = async (req, res) => {

//     try {

//         const { groupNumber, interviewDate, location } = req.body;

//         const students = await OfflineInterview.find({
//             groupNumber
//         });

//         for (const student of students) {

//             student.interviewDate = interviewDate;
//             student.interviewLocation = location;

//             await student.save();

//         }

//         res.json({
//             message: "Interview scheduled"
//         });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }

// };


// // send Notifications
// exports.sendNotification = async (req, res) => {
//     try {

//         const { groupNumber } = req.body;

//         if (!groupNumber) {
//             return res.status(400).json({
//                 message: "groupNumber is required"
//             });
//         }

//         const students = await OfflineInterview.find({ groupNumber });

//         if (students.length === 0) {
//             return res.status(404).json({
//                 message: "No students found for this group"
//             });
//         }

//         for (const student of students) {

//             if (!student.interviewDate || !student.interviewLocation) {
//                 continue;
//             }

//             const formattedDate = new Date(student.interviewDate)
//                 .toLocaleDateString("en-IN");

//             await axios.post(
//                 "https://control.msg91.com/api/v5/flow",
//                 {
//                     template_id: process.env.MSG91_TEMPLATE_ID,
//                     short_url: "0",
//                     recipients: [
//                         {
//                             mobiles: "91" + student.mobile,
//                             name: student.name,
//                             date: formattedDate,
//                             location: student.interviewLocation
//                         }
//                     ]
//                 },
//                 {
//                     headers: {
//                         authkey: process.env.MSG91_API_KEY,
//                         "Content-Type": "application/json"
//                     }
//                 }
//             );

//             student.notificationSent = true;
//             await student.save();

//         }

//         res.json({
//             message: "Notification sent successfully",
//             totalStudents: students.length
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: error.message });
//     }
// };



const OfflineEvent = require("../Models/OfflineInterview");
const axios = require("axios");


exports.registerStudent = async (req, res) => {

    try {

        const {
            name,
            email,
            mobile,
            exam,
            type,
            rollNumber,
            qualification,
            city,
            state
        } = req.body;

        if (!name || !mobile || !exam || !type) {
            return res.status(400).json({
                message: "Required fields missing"
            });
        }

        const student = new OfflineEvent({
            name,
            email,
            mobile,
            exam,
            type,
            rollNumber,
            qualification,
            city,
            state
        });

        await student.save();

        res.json({
            message: "Form submitted successfully",
            data: student
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};


exports.getStudents = async (req, res) => {

    try {

        const { type } = req.query;

        let filter = {};

        if (type) {
            filter.type = type;
        }

        const students = await OfflineEvent
            .find(filter)
            .populate("exam")
            .sort({ createdAt: -1 });

        res.json(students);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};


exports.createGroups = async (req, res) => {

    try {

        const { groupSize, type } = req.body;

        if (!groupSize || groupSize <= 0) {
            return res.status(400).json({
                message: "groupSize must be greater than 0"
            });
        }

        if (!type) {
            return res.status(400).json({
                message: "type is required (test or interview)"
            });
        }

        // only same type students
        const students = await OfflineEvent
            .find({
                groupNumber: null,
                type: type
            })
            .sort({ createdAt: 1 });

        if (students.length === 0) {
            return res.json({
                message: "No students available for grouping"
            });
        }

        // last group number of same type
        const lastGroup = await OfflineEvent
            .findOne({
                groupNumber: { $ne: null },
                type: type
            })
            .sort({ groupNumber: -1 });

        let group = lastGroup ? lastGroup.groupNumber + 1 : 1;

        for (let i = 0; i < students.length; i += groupSize) {

            const batch = students.slice(i, i + groupSize);

            for (const student of batch) {

                student.groupNumber = group;
                await student.save();

            }

            group++;

        }

        res.json({
            message: "Groups created successfully",
            type: type,
            totalStudents: students.length
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};


exports.scheduleEvent = async (req, res) => {

    try {

        const { groupNumber, scheduleDate, location } = req.body;

        const students = await OfflineEvent.find({
            groupNumber
        });

        if (students.length === 0) {
            return res.status(404).json({
                message: "No students found"
            });
        }

        for (const student of students) {

            student.scheduleDate = scheduleDate;
            student.location = location;

            await student.save();

        }

        res.json({
            message: "Event scheduled successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};


exports.sendNotification = async (req, res) => {

    try {

        const { groupNumber, type } = req.body;

        const students = await OfflineEvent.find({
            groupNumber,
            type
        });

        if (students.length === 0) {
            return res.status(404).json({
                message: "No students found"
            });
        }

        for (const student of students) {

            if (!student.scheduleDate || !student.location) continue;

            const formattedDate = new Date(student.scheduleDate)
                .toLocaleDateString("en-IN");

            const eventType = student.type === "test"
                ? "Offline Test"
                : "Interview";

            await axios.post(
                "https://control.msg91.com/api/v5/flow",
                {
                    template_id: process.env.MSG91_TEMPLATE_ID,
                    short_url: "0",
                    recipients: [
                        {
                            mobiles: "91" + student.mobile,
                            name: student.name,
                            type: eventType,
                            date: formattedDate,
                            location: student.location
                        }
                    ]
                },
                {
                    headers: {
                        authkey: process.env.MSG91_API_KEY,
                        "Content-Type": "application/json"
                    }
                }
            );

            student.notificationSent = true;
            await student.save();

        }

        res.json({
            message: "Notification sent successfully",
            totalStudents: students.length
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};