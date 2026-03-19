// const User = require("../Models/User");
// const Order = require("../Models/Order");
// const Course = require("../Models/Course");
// const FAQ = require("../Models/FAQ");
// const TestSeries = require("../Models/TestSeries");
// const Note = require("../Models/Note");
// const Doubt = require("../Models/Doubt");

// exports.getCounts = async (req, res) => {
//     try {
//         const [
//             totalUsers,
//             totalOrders,
//             totalCourses,
//             totalFaqs,
//             totalTestSeries,
//             totalNotes,
//             totalDoubts
//         ] = await Promise.all([
//             User.countDocuments(),
//             Order.countDocuments(),
//             Course.countDocuments(),
//             FAQ.countDocuments(),
//             TestSeries.countDocuments(),
//             Note.countDocuments(),
//             Doubt.countDocuments()
//         ]);

//         res.status(200).json({
//             success: true,
//             counts: {
//                 users: totalUsers,
//                 orders: totalOrders,
//                 courses: totalCourses,
//                 faqs: totalFaqs,
//                 testSeries: totalTestSeries,
//                 notes: totalNotes,
//                 doubts: totalDoubts
//             }
//         });
//     } catch (error) {
//         console.error("❌ Error fetching counts:", error);
//         res.status(500).json({
//             success: false,
//             message: "Error fetching counts",
//             error: error.message
//         });
//     }
// };


const User = require("../Models/User");
const Order = require("../Models/Order");
const Course = require("../Models/Course");
const FAQ = require("../Models/FAQ");
const TestSeries = require("../Models/TestSeries");
const Note = require("../Models/Note");
const Doubt = require("../Models/Doubt");


const validOrderFilter = {
  paymentStatus: "paid",
  orderStatus: "completed"
};

exports.getCounts = async (req, res) => {
  try {

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    // const [
    //   totalUsers,
    //   totalOrders,
    //   totalCourses,
    //   totalFaqs,
    //   totalTestSeries,
    //   totalNotes,
    //   totalDoubts,

    //   todayUsers,
    //   todayOrders,

    //   totalRevenue,
    //   todayRevenue
    // ] = await Promise.all([

    //   User.countDocuments(),
    //   Order.countDocuments(),
    //   Course.countDocuments(),
    //   FAQ.countDocuments(),
    //   TestSeries.countDocuments(),
    //   Note.countDocuments(),
    //   Doubt.countDocuments(),

    //   User.countDocuments({ createdAt:{ $gte: todayStart,$lte:todayEnd } }),
    //   Order.countDocuments({ createdAt:{ $gte: todayStart,$lte:todayEnd } }),

    //   Order.aggregate([
    //     { $match:{ paymentStatus:"paid"} },
    //     { $group:{ _id:null,total:{ $sum:"$totalAmount"}}}
    //   ]),

    //   Order.aggregate([
    //     {
    //       $match:{
    //         paymentStatus:"paid",
    //         createdAt:{ $gte:todayStart,$lte:todayEnd }
    //       }
    //     },
    //     { $group:{ _id:null,total:{ $sum:"$totalAmount"}}}
    //   ])

    // ]);

    // last 7 days orders
   
   
    const [
  totalUsers,
  totalOrders,
  totalCourses,
  totalFaqs,
  totalTestSeries,
  totalNotes,
  totalDoubts,

  todayUsers,
  todayOrders,

  totalRevenue,
  todayRevenue
] = await Promise.all([

  User.countDocuments(),

  // ✅ ONLY PAID + COMPLETED
  Order.countDocuments(validOrderFilter),

  Course.countDocuments(),
  FAQ.countDocuments(),
  TestSeries.countDocuments(),
  Note.countDocuments(),
  Doubt.countDocuments(),

  User.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),

  // ✅ TODAY VALID ORDERS
  Order.countDocuments({
    ...validOrderFilter,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  }),

  // ✅ TOTAL REVENUE (ONLY VALID)
  Order.aggregate([
    { $match: validOrderFilter },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ]),

  // ✅ TODAY REVENUE (ONLY VALID)
  Order.aggregate([
    {
      $match: {
        ...validOrderFilter,
        createdAt: { $gte: todayStart, $lte: todayEnd }
      }
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
  ])

]);
   
    const last7Days = await Order.aggregate([
      {
        $match:{
          createdAt:{
            $gte:new Date(Date.now()-7*24*60*60*1000)
          }
        }
      },
      {
        $group:{
          _id:{
            $dateToString:{ format:"%Y-%m-%d",date:"$createdAt"}
          },
          orders:{ $sum:1 }
        }
      },
      { $sort:{ _id:1 }}
    ]);

    res.json({
      success:true,
      dashboard:{
        totals:{
          users:totalUsers,
          orders:totalOrders,
          courses:totalCourses,
          faqs:totalFaqs,
          testSeries:totalTestSeries,
          notes:totalNotes,
          doubts:totalDoubts
        },
        today:{
          users:todayUsers,
          orders:todayOrders
        },
        revenue:{
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0
        },
        charts:{
          orders:last7Days
        }
      }
    });

  } catch(error){
    res.status(500).json({success:false,message:error.message});
  }
};