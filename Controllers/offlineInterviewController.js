
const OfflineEvent = require("../Models/OfflineInterview");

const axios = require("axios");


exports.registerStudent = async (req, res) => {

    try {

        const { name, mobile, exam, interviewType } = req.body;

        if (!name || !mobile || !exam || !interviewType) {
            return res.status(400).json({
                message: "name, mobile, exam, interviewType are required"
            });
        }
        const student = new OfflineEvent({
            ...req.body,
            type: "interview"

        });

        await student.save();

        res.json({
            message: "Form submitted successfully",
            studentId: student._id,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudents = async (req, res) => {

    try {

        const students = await OfflineEvent
            .find()
            .populate("exam")
            .sort({ createdAt: -1 });

        res.json(students);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};

exports.getStudentById = async (req, res) => {

    try {

        const { id } = req.params;
        const student = await OfflineEvent
            .findById(id)
            .populate("exam");

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json({
            message: "Student fetched successfully",
            data: student
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }

};

exports.createGroups = async (req, res) => {

    try {

        const { groupSize } = req.body;

        if (!groupSize || groupSize <= 0) {
            return res.status(400).json({
                message: "groupSize must be greater than 0"
            });
        }


        // only same type students
        const students = await OfflineEvent
            .find({
                groupNumber: null,
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

        const { groupNumber } = req.body;

        const students = await OfflineEvent.find({
            groupNumber,
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

            const eventType = "Interview";

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