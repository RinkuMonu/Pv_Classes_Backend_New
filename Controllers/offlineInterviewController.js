
const OfflineEvent = require("../Models/OfflineInterview");
const Order = require("../Models/Order");

const axios = require("axios");


// exports.registerStudent = async (req, res) => {

//     try {

//         const {
//             name,
//             fatherName,
//             motherName,
//             email,
//             mobile,
//             exam,
//             type,
//             rollNumber,
//             qualification,
//             city,
//             state,
//             teachingSubjects,
//             disabilitySpecialization
//         } = req.body;

//         if (!name || !mobile || !exam || !type) {
//             return res.status(400).json({
//                 message: "Required fields missing"
//             });
//         }

//         const student = new OfflineEvent({
//             name,
//             fatherName,
//             motherName,
//             email,
//             mobile,
//             exam,
//             type,
//             rollNumber,
//             qualification,
//             city,
//             state,
//             teachingSubjects,
//             disabilitySpecialization
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



exports.registerStudent = async (req, res) => {
  try {
    const data = req.body;

    const student = new OfflineEvent({
      ...data,
      type: "test",
      amount: 450
    });

    await student.save();

    // ✅ Create order for this student
    const order = new Order({
      user: req.user.id, // optional
      offlineStudent: student._id, // 🔥 link student
      totalAmount: 450,
      paymentMethod: "upi",
      paymentStatus: "pending",
      orderStatus: "processing"
    });

    await order.save();

    res.json({
      message: "Form submitted, proceed to payment",
      studentId: student._id,
      orderId: order._id
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


exports.getStudentStats = async (req, res) => {
  try {

    // 🔹 SUBJECT WISE COUNT
    const subjectStats = await OfflineEvent.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },
      { $unwind: "$teachingSubjects" },
      {
        $group: {
          _id: "$teachingSubjects",
          count: { $sum: 1 }
        }
      }
    ]);

    // 🔹 DISABILITY COUNT
    const disabilityStats = await OfflineEvent.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          disabilitySpecialization: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$disabilitySpecialization",
          count: { $sum: 1 }
        }
      }
    ]);

    // 🔹 FORMAT SUBJECT DATA (all subjects include karo)
    const subjects = ["maths", "sst", "hindi", "english", "science"];

    const formattedSubjects = subjects.map(sub => {
      const found = subjectStats.find(s => s._id === sub);
      return {
        subject: sub,
        count: found ? found.count : 0
      };
    });

    res.json({
      success: true,
      data: {
        subjects: formattedSubjects,
        disability: disabilityStats
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
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