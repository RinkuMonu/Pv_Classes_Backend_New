// Controllers/testSeriesController.js
const mongoose = require("mongoose");
const TestSeries = require("../Models/TestSeries");

/* ---------- EXISTING: create ---------- */
// exports.createTestSeries = async (req, res) => {

//   try {
//     const {
//       exam_id, title, title_tag, description,
//       price, discount_price, validity, total_tests, is_active
//     } = req.body;

//     let subjects = [];
//     if (req.body.subjects) {
//       try { subjects = JSON.parse(req.body.subjects); }
//       catch { return res.status(400).json({ error: "Invalid JSON format for subjects" }); }
//     }

//     let images = [];
//     if (req.files && req.files.length > 0) {
//       images = req.files.map((file) => file.filename); // keep only filename 
//     }

//     const testSeries = await TestSeries.create({
//       exam_id, title, title_tag, description,
//       price, discount_price, validity, total_tests,
//       subjects, is_active, images,
//       tests: [], attempts: []
//     });

//     res.status(201).json({ success: true, message: "Test Series created", data: testSeries });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };


exports.createTestSeries = async (req, res) => {
  try {
    const {
      exam_id, title, title_tag, description,
      price, discount_price, validity, total_tests, is_active, is_free
    } = req.body;

    let subjects = [];
    if (req.body.subjects) {
      try { subjects = JSON.parse(req.body.subjects); }
      catch { return res.status(400).json({ error: "Invalid JSON format for subjects" }); }
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.filename);
    }

    // ✅ Safely normalize is_free value
    const isFreeValue =
      String(is_free).replace(/"/g, '').trim().toLowerCase() === 'true';

    const testSeries = await TestSeries.create({
      exam_id,
      title,
      title_tag,
      description,
      price,
      discount_price,
      validity,
      total_tests,
      subjects,
      is_active,
      is_free: is_free !== undefined ? String(is_free).replace(/"/g, '').trim().toLowerCase() === 'true' : true,
      images,
      tests: [],
      attempts: []
    });


    res.status(201).json({
      success: true,
      message: "Test Series created",
      data: testSeries
    });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

/* ---------- EXISTING: list ---------- */
exports.getAllTestSeries = async (req, res) => {
  try {
    const testSeriesList = await TestSeries.find()
      .populate("exam_id", "name")
      .sort({ createdAt: -1 });

    if (!testSeriesList || testSeriesList.length === 0) {
      return res.status(404).json({ success: false, message: "No Test Series found" });
    }

    const groupedData = testSeriesList.reduce((acc, series) => {
      const examId = series.exam_id?._id?.toString();
      const examName = series.exam_id?.name || "Unknown Exam";

      if (!acc[examId]) {
        acc[examId] = {
          exam_id: examId,
          exam_name: examName,
          series: []
        };
      }

      acc[examId].series.push(series.toJSON());
      return acc;
    }, {});
    res.status(200).json({
      success: true,
      message: "Test Series fetched successfully",
      data: Object.values(groupedData)
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};
/* ---------- EXISTING: by exam ---------- */
exports.getByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const series = await TestSeries.find({ exam_id: examId })
      .populate("exam_id", "name")
      .sort({ createdAt: -1 });
    if (!series || series.length === 0) {
      return res.status(404).json({ success: false, message: "No Test Series for the exam" });
    }
    res.status(200).json({ success: true, message: "Fetched", data: series });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};

/* ---------- EXISTING: by id ---------- */
exports.getTestSeriesById = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const series = await TestSeries.findById(req.params.id)
      .populate("exam_id", "name")
      .lean();

    if (!series) {
      return res.status(404).json({ success: false, message: "Test Series not found" });
    }

    if (userId) {
      series.attempts = Array.isArray(series.attempts)
        ? series.attempts.filter((a) => String(a.user_id) === String(userId))
        : [];
    }

    res.status(200).json({ success: true, message: "Fetched", data: series });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};




/* ---------- EXISTING: update (fixed file field) ---------- */
exports.updateTestSeries = async (req, res) => {
  try {
    const {
      exam_id, title, title_tag, description,
      price, discount_price, validity, total_tests, is_active, is_free
    } = req.body;

    let subjects;
    if (req.body.subjects) {
      try { subjects = JSON.parse(req.body.subjects); }
      catch { return res.status(400).json({ success: false, message: "Invalid JSON format for subjects" }); }
    }

    let images;
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.filename); // keep only filename
    }



    const updateData = {
      exam_id, title, title_tag, description, price,
      discount_price, validity, total_tests, is_active
    };
    if (subjects) updateData.subjects = subjects;
    if (images) updateData.images = images;

    if (is_free !== undefined) {
      updateData.is_free =
        String(is_free).trim().toLowerCase() === "true";
    }

    const series = await TestSeries.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!series) return res.status(404).json({ success: false, message: "Test Series not found" });

    res.status(200).json({ success: true, message: "Updated", data: series });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};

/* ---------- EXISTING: delete ---------- */
exports.deleteTestSeries = async (req, res) => {
  try {
    const series = await TestSeries.findByIdAndDelete(req.params.id);
    if (!series) return res.status(404).json({ error: "Test Series not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   NEW: Admin helpers inside the SAME model
   ========================================================= */

// Add a Test inside a TestSeries
exports.addEmbeddedTest = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { title, subject, type = "daily_quiz", perQuestionTimeSec = 30, durationSec = 0, is_active = true, scheduleDate } = req.body;

    const series = await TestSeries.findById(seriesId);
    if (!series) return res.status(404).json({ message: "Series not found" });

    const testDoc = {
      _id: new mongoose.Types.ObjectId(),
      title, subject, type, perQuestionTimeSec, durationSec, is_active,
      scheduleDate: scheduleDate ? new Date(scheduleDate) : undefined,
      questions: []
    };

    series.tests.push(testDoc);
    series.total_tests = (series.total_tests || 0) + 1;
    await series.save();

    res.json({ success: true, message: "Test added", test_id: testDoc._id, data: testDoc });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Add Questions (bulk) to an embedded Test
exports.addQuestionsToEmbeddedTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { questions } = req.body; // array of question objects

    const series = await TestSeries.findById(seriesId);
    if (!series) return res.status(404).json({ message: "Series not found" });

    const test = series.tests.id(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // push with new _id auto
    (questions || []).forEach(q => test.questions.push(q));
    await series.save();

    res.json({ success: true, message: "Questions added", count: questions?.length || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


/* -------------------- DELETE QUESTION FROM EMBEDDED TEST -------------------- */
exports.deleteQuestionFromEmbeddedTest = async (req, res) => {
  const RID = sid();
  const log = (...a) => console.log(`[deleteQuestion:${RID}]`, ...a);

  try {
    log("START", req.method, req.originalUrl, "params:", req.params);

    const { seriesId, testId, questionId } = req.params || {};
    if (!seriesId || !testId || !questionId) {
      log("ERR missing params");
      return res.status(400).json({ message: "seriesId, testId, or questionId missing" });
    }

    if (!validId(seriesId) || !validId(testId) || !validId(questionId)) {
      log("ERR invalid ObjectId");
      return res.status(400).json({ message: "Invalid seriesId, testId, or questionId" });
    }

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      log("ERR series not found");
      return res.status(404).json({ message: "Series not found" });
    }

    series.tests = clean(series.tests);
    const test = findByIdManual(series.tests, testId);
    if (!test) {
      log("ERR test not found");
      return res.status(404).json({ message: "Test not found" });
    }

    test.questions = clean(test.questions);
    const questionIndex = test.questions.findIndex(q =>
      q && q._id && String(q._id) === String(questionId)
    );

    if (questionIndex === -1) {
      log("ERR question not found");
      return res.status(404).json({ message: "Question not found" });
    }

    // Remove the question
    test.questions.splice(questionIndex, 1);
    await series.save();

    log("OK question deleted");
    return res.json({
      success: true,
      message: "Question deleted successfully",
      deletedQuestionId: questionId
    });

  } catch (e) {
    console.error(`[deleteQuestion:${RID}] ERROR`, e && e.stack ? e.stack : e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  } finally {
    console.log(`[deleteQuestion:${RID}] END`);
  }
};

/* =========================================================
   NEW: Daily Quiz Flow (single model)
   ========================================================= */

// Controllers/testSeriesController.js




// Local sanitize (in case schema method missing)
const localSanitize = (q) => {
  if (!q) return q;
  const obj = q.toObject ? q.toObject() : { ...q };
  delete obj.correctOptions;
  delete obj.correctNumeric;
  delete obj.is_active;
  delete obj.__v;
  return obj;
};

// Small helpers for logging
const sid = () => Math.random().toString(36).slice(2, 8); // short req id
const asStr = (v) => (v && v.toString ? v.toString() : String(v));

exports.startEmbeddedTest = async (req, res) => {
  const RID = sid(); // request correlation id for logs
  const log = (...args) => console.log(`[startEmbeddedTest:${RID}]`, ...args);

  try {
    log("----- START -----");
    log("URL:", req.method, req.originalUrl);
    log("params:", req.params);

    // 1) Validate params
    const { seriesId, testId } = req.params || {};
    if (!seriesId || !testId) {
      log("ERR: missing route params", { seriesId, testId });
      return res.status(400).json({ message: "seriesId or testId missing in route" });
    }
    const validSeries = mongoose.Types.ObjectId.isValid(seriesId);
    const validTest = mongoose.Types.ObjectId.isValid(testId);
    log("param validity:", { validSeries, validTest });

    if (!validSeries || !validTest) {
      return res.status(400).json({ message: "Invalid seriesId or testId" });
    }

    // 2) Resolve user (hardcoded for testing)
    const userId = req?.user?.id; // replace with req.user._id later
    log("userId (using hardcoded for now):", userId);

    // 3) Load series
    const series = await TestSeries.findById(seriesId);
    if (!series) {
      log("ERR: Series not found");
      return res.status(404).json({ message: "Series not found" });
    }
    log("series loaded:", { _id: asStr(series._id), testsType: typeof series.tests });

    // 4) Clean tests array
    if (!Array.isArray(series.tests)) {
      log("WARN: series.tests not array; initializing []");
      series.tests = [];
    }
    const nullTests = series.tests.filter((t) => !t).length;
    log("tests length (raw):", series.tests.length, "null/undefined entries:", nullTests);
    series.tests = series.tests.filter(Boolean);
    log("tests length (cleaned):", series.tests.length);

    // Print test ids for verification
    log(
      "test ids:",
      series.tests.map((t) => asStr(t._id))
    );

    // 5) Find test manually (avoid .id())
    const test = series.tests.find((t) => t && t._id && t._id.toString() === String(testId));
    if (!test) {
      log("ERR: Test not found for testId:", testId);
      return res.status(404).json({ message: "Test not found" });
    }
    log("test found:", { _id: asStr(test._id), is_active: test.is_active });

    if (test.is_active === false) {
      log("ERR: Test not active");
      return res.status(404).json({ message: "Test not active" });
    }

    // 6) Clean questions; ensure _id on each
    if (!Array.isArray(test.questions)) {
      log("WARN: test.questions not array; initializing []");
      test.questions = [];
    }
    const nullQs = test.questions.filter((q) => !q).length;
    log("questions length (raw):", test.questions.length, "null/undefined:", nullQs);
    test.questions = test.questions.filter(Boolean);

    let mutated = false;
    let missingIdCount = 0;
    test.questions.forEach((q, idx) => {
      if (!q._id) {
        q._id = new mongoose.Types.ObjectId();
        missingIdCount++;
        mutated = true;
      }
      if (typeof q.is_active === "undefined") {
        q.is_active = true; // default active
        mutated = true;
      }
    });
    log("questions length (cleaned):", test.questions.length, "missingIdFixed:", missingIdCount);

    if (mutated) {
      log("questions mutated -> saving series to persist generated _ids/flags…");
      await series.save();
      log("series saved after mutation.");
    }

    // 7) Active questions
    const activeQs = test.questions.filter((q) => q && q.is_active !== false);
    log("active questions:", activeQs.length);
    if (!activeQs.length) {
      log("ERR: No active questions");
      return res.status(400).json({ message: "No active questions in this test" });
    }

    // 8) Build order (log sample)
    const order = activeQs.map((q) => q._id).filter(Boolean);
    log("order length:", order.length, "first few:", order.slice(0, 5).map(asStr));

    if (!order.length) {
      log("ERR: order empty after filtering _ids");
      return res.status(400).json({ message: "Questions missing _id; regenerated, try again" });
    }

    // 9) Create attempt
    const attempt = {
      _id: new mongoose.Types.ObjectId(),
      user_id: new mongoose.Types.ObjectId(userId),
      test_id: test._id,
      status: "ongoing",
      currentIndex: 0,
      questionOrder: order,
      responses: order.map((qid) => ({ question_id: qid, startedAt: new Date() }))
    };
    if (!Array.isArray(series.attempts)) series.attempts = [];

    series.attempts.push(attempt);
    await series.save();
    log("attempt saved:", { attempt_id: asStr(attempt._id), responses: attempt.responses.length });

    // 10) First question (sanitized)
    const firstId = order[0];
    const firstQ = test.questions.find((qq) => qq && qq._id && String(qq._id) === String(firstId));
    log("first question found:", !!firstQ, "id:", asStr(firstId));

    const sanitize =
      typeof series.sanitizeQuestion === "function"
        ? series.sanitizeQuestion.bind(series)
        : localSanitize;

    const sanitized = sanitize(firstQ);
    log("sanitized question keys:", sanitized ? Object.keys(sanitized) : "null");

    // 11) Respond
    log("SUCCESS -> sending 201");
    return res.status(201).json({
      success: true,
      attempt_id: attempt._id,
      perQuestionTimeSec: test.perQuestionTimeSec || 30,
      currentIndex: 0,
      total: order.length,
      question: sanitized
    });
  } catch (e) {
    console.error(`[startEmbeddedTest:${RID}] ERROR:`, e && e.stack ? e.stack : e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  } finally {
    console.log(`[startEmbeddedTest:${RID}] ----- END -----`);
  }
};


const clean = (arr) => (Array.isArray(arr) ? arr.filter(Boolean) : []);
const findByIdManual = (arr, id) =>
  (Array.isArray(arr) ? arr : []).find((x) => x && x._id && String(x._id) === String(id));
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const getUserIdFromReq = (req) => {
  const tokenUserId = req.user?.id || req.user?._id || req.user?.userId || req.user?.sub;
  const fallback = req.user?.id; // <— testing fallback

  return String(tokenUserId || fallback);
};
const getSanitizer = (series) =>
  typeof series?.sanitizeQuestion === "function" ? series.sanitizeQuestion.bind(series) : localSanitize;

/* -------------------- GET CURRENT -------------------- */
exports.getCurrentEmbedded = async (req, res) => {
  const RID = sid();
  const log = (...a) => console.log(`[getCurrent:${RID}]`, ...a);

  try {
    log("START", req.method, req.originalUrl, "params:", req.params);

    const { seriesId, attemptId } = req.params || {};
    if (!seriesId || !attemptId) {
      log("ERR missing params", { seriesId, attemptId });
      return res.status(400).json({ message: "seriesId or attemptId missing" });
    }
    if (!validId(seriesId) || !validId(attemptId)) {
      log("ERR invalid ObjectId", { seriesId, attemptId });
      return res.status(400).json({ message: "Invalid seriesId or attemptId" });
    }

    let userId = getUserIdFromReq(req);
    if (!userId && req.user && req.user.id) {
      userId = req.user.id;
    }
    console.log("userId ======= :", "1444444");

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      log("ERR series not found");
      return res.status(404).json({ message: "Series not found" });
    }

    series.attempts = clean(series.attempts);
    series.tests = clean(series.tests);
    log("counts:", { attempts: series.attempts.length, tests: series.tests.length });

    const attempt = findByIdManual(series.attempts, attemptId);
    if (!attempt) {
      log("ERR attempt not found", attemptId);
      return res.status(404).json({ message: "Attempt not found" });
    }
    log("attempt found", { id: asStr(attempt._id), status: attempt.status });

    if (attempt.status !== "ongoing" || String(attempt.user_id) !== String(userId)) {
      log("ERR attempt not active or user mismatch", { attemptUser: asStr(attempt.user_id) });
      return res.status(404).json({ message: "Attempt not active" });
    }

    const test = findByIdManual(series.tests, attempt.test_id);
    if (!test) {
      log("ERR test not found in series", attempt.test_id);
      return res.status(404).json({ message: "Test not found" });
    }

    const idx = Number(attempt.currentIndex || 0);
    const qOrder = Array.isArray(attempt.questionOrder) ? attempt.questionOrder : [];
    log("pointer", { idx, qOrderLen: qOrder.length });

    if (idx < 0 || idx >= qOrder.length) {
      log("ERR pointer out of range");
      return res.status(400).json({ message: "Current question pointer invalid" });
    }

    test.questions = clean(test.questions);
    const qId = qOrder[idx];
    const q = findByIdManual(test.questions, qId);
    if (!q) {
      log("ERR question not found for qId", asStr(qId));
      return res.status(404).json({ message: "Question not found" });
    }

    // Ensure responses[idx] exists and has startedAt
    attempt.responses = Array.isArray(attempt.responses) ? attempt.responses : [];
    while (attempt.responses.length <= idx) attempt.responses.push({}); // pad
    if (!attempt.responses[idx].question_id) attempt.responses[idx].question_id = qId;
    if (!attempt.responses[idx].startedAt) {
      attempt.responses[idx].startedAt = new Date();
      await series.save();
      log("response startedAt set & series saved");
    }

    const sanitize = getSanitizer(series);
    const sanitizedQ = sanitize(q);

    log("OK return current");
    return res.json({
      success: true,
      perQuestionTimeSec: test.perQuestionTimeSec || 30,
      currentIndex: idx,
      total: qOrder.length,
      question: sanitizedQ
    });
  } catch (e) {
    console.error(`[getCurrent:${RID}] ERROR`, e && e.stack ? e.stack : e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  } finally {
    console.log(`[getCurrent:${RID}] END`);
  }
};

/* -------------------- ANSWER & NEXT -------------------- */
exports.answerEmbeddedCurrent = async (req, res) => {
  const RID = sid();
  const log = (...a) => console.log(`[answerCurrent:${RID}]`, ...a);

  try {
    const { seriesId, attemptId } = req.params || {};
    if (!seriesId || !attemptId) {
      return res.status(400).json({ message: "seriesId or attemptId missing" });
    }
    if (!validId(seriesId) || !validId(attemptId)) {
      return res.status(400).json({ message: "Invalid seriesId or attemptId" });
    }

    // ✅ userId extract + fallback
    const userId = getUserIdFromReq(req) ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { selectedOptions = [], numericAnswer } = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: "Series not found" });
    }

    series.attempts = clean(series.attempts);
    series.tests = clean(series.tests);

    const attempt = findByIdManual(series.attempts, attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }

    // ✅ attempt ke andar userId save karna (agar pehle se missing hai to)
    if (!attempt.user_id) {
      attempt.user_id = userId;
    }

    const test = findByIdManual(series.tests, attempt.test_id);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    const idx = Number(attempt.currentIndex || 0);
    const qOrder = Array.isArray(attempt.questionOrder) ? attempt.questionOrder : [];
    if (idx < 0 || idx >= qOrder.length) {
      return res.status(400).json({ message: "Current question pointer invalid" });
    }

    test.questions = clean(test.questions);
    const qId = qOrder[idx];
    const q = findByIdManual(test.questions, qId);
    if (!q) {
      return res.status(404).json({ message: "Question not found" });
    }

    attempt.responses = Array.isArray(attempt.responses) ? attempt.responses : [];
    while (attempt.responses.length <= idx) attempt.responses.push({});
    const now = new Date();
    const startedAt = attempt.responses[idx].startedAt ? new Date(attempt.responses[idx].startedAt) : now;

    const timeSpentSec = Math.min(
      Math.max(0, Math.floor((now - startedAt) / 1000)),
      test.perQuestionTimeSec || 30
    );

    let isCorrect = false;
    if (q.type === "mcq_single" || q.type === "mcq_multi") {
      const corr = (q.correctOptions || []).slice().sort().join("|");
      const user = (selectedOptions || []).slice().sort().join("|");
      isCorrect = corr.length > 0 && corr === user;
    } else if (q.type === "numeric") {
      if (numericAnswer !== undefined && numericAnswer !== null && String(numericAnswer) !== "") {
        isCorrect = Number(numericAnswer) === Number(q.correctNumeric);
      }
    }

    const attempted =
      (Array.isArray(selectedOptions) && selectedOptions.length > 0) ||
      (numericAnswer !== undefined && numericAnswer !== null && String(numericAnswer) !== "");

    const marks = Number(q.marks ?? 1);
    const neg = Number(q.negativeMarks ?? 0);
    const marksAwarded = attempted ? (isCorrect ? marks : -neg) : 0;

    // ✅ response ke andar bhi userId save karna
    Object.assign(attempt.responses[idx], {
      user_id: userId,
      question_id: qId,
      selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [],
      numericAnswer: numericAnswer,
      isCorrect,
      marksAwarded,
      timeSpentSec,
      answeredAt: now
    });

    attempt.currentIndex = idx + 1;

    if (attempt.currentIndex < qOrder.length) {
      const nextIdx = attempt.currentIndex;
      while (attempt.responses.length <= nextIdx) attempt.responses.push({});
      attempt.responses[nextIdx].question_id = qOrder[nextIdx];
      attempt.responses[nextIdx].startedAt = new Date();

      await series.save();
      const nextQ = findByIdManual(test.questions, qOrder[nextIdx]);
      const sanitize = getSanitizer(series);
      log("OK move next", { nextIdx });
      return res.json({
        success: true,
        done: false,
        currentIndex: nextIdx,
        total: qOrder.length,
        perQuestionTimeSec: test.perQuestionTimeSec || 30,
        question: sanitize(nextQ)
      });
    }

    const result = computeSummary(attempt);
    attempt.status = "submitted";
    Object.assign(attempt, result);
    await series.save();
    log("OK finished", result);

    return res.json({ success: true, done: true, result });
  } catch (e) {
    console.error(`[answerCurrent:${RID}] ERROR`, e && e.stack ? e.stack : e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  } finally {
    console.log(`[answerCurrent:${RID}] END`);
  }
};


/* -------------------- FINISH (manual submit) -------------------- */
exports.finishEmbeddedAttempt = async (req, res) => {
  const RID = sid();
  const log = (...a) => console.log(`[finishAttempt:${RID}]`, ...a);

  try {
    log("START", req.method, req.originalUrl, "params:", req.params);

    const { seriesId, attemptId } = req.params || {};
    if (!seriesId || !attemptId) {
      log("ERR missing params");
      return res.status(400).json({ message: "seriesId or attemptId missing" });
    }
    if (!validId(seriesId) || !validId(attemptId)) {
      log("ERR invalid ids");
      return res.status(400).json({ message: "Invalid seriesId or attemptId" });
    }

    const userId = getUserIdFromReq(req);
    log("userId finish = :", userId);

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      log("ERR series not found");
      return res.status(404).json({ message: "Series not found" });
    }

    series.attempts = clean(series.attempts);
    const attempt = findByIdManual(series.attempts, attemptId);
    if (!attempt) {
      log("ERR attempt not found");
      return res.status(404).json({ message: "Attempt not found" });
    }
    if (attempt.status !== "ongoing" || String(attempt.user_id) !== String(userId)) {
      log("ERR attempt not active or user mismatch");
      return res.status(404).json({ message: "Attempt not active" });
    }

    const result = computeSummary(attempt);
    attempt.status = "submitted";
    Object.assign(attempt, result);
    await series.save();

    log("OK submitted", result);
    return res.json({ success: true, result });
  } catch (e) {
    console.error(`[finishAttempt:${RID}] ERROR`, e && e.stack ? e.stack : e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  } finally {
    console.log(`[finishAttempt:${RID}] END`);
  }
};

/* -------------------- Summary -------------------- */
function computeSummary(attempt) {
  let totalMarks = 0,
    correctCount = 0,
    wrongCount = 0,
    unattemptedCount = 0;

  const resp = Array.isArray(attempt.responses) ? attempt.responses : [];
  resp.forEach((r) => {
    const attempted =
      (Array.isArray(r.selectedOptions) && r.selectedOptions.length > 0) ||
      (r.numericAnswer !== undefined && r.numericAnswer !== null && String(r.numericAnswer) !== "");
    if (attempted) {
      totalMarks += Number(r.marksAwarded || 0);
      if (r.isCorrect) correctCount++;
      else wrongCount++;
    } else {
      unattemptedCount++;
    }
  });

  return {
    totalMarks,
    correctCount,
    wrongCount,
    unattemptedCount,
    totalQuestions: Array.isArray(attempt.questionOrder) ? attempt.questionOrder.length : 0
  };
}

exports.getAnswerSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromReq(req) || req.user.id;
    console.log("userId answer sheet = :", userId);

    if (!validId(id)) {
      return res.status(400).json({ message: "Invalid testSeriesId" });
    }

    const series = await TestSeries.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Series not found" });
    }

    // ✅ Sirf current user ke attempts lo
    const userAttempts = Array.isArray(series.attempts)
      ? series.attempts.filter(a => String(a.user_id) === String(userId))
      : [];

    // ✅ Test ke sath matching attempt attach karo
    const testsWithAttempts = series.tests.map(test => {
      const attemptsForTest = userAttempts.filter(
        a => String(a.test_id) === String(test._id)
      );

      // ✅ Latest attempt nikalo (agar multiple ho to)
      const latestAttempt = attemptsForTest.length
        ? attemptsForTest.reduce((latest, attempt) =>
          new Date(attempt.createdAt) > new Date(latest.createdAt) ? attempt : latest
        )
        : null;

      // ✅ Agar attempt mila to uske responses ko questions me merge karo
      const questionsWithAttempts = test.questions.map(q => {
        const response = latestAttempt?.responses?.find(
          r => String(r.question_id) === String(q._id)
        );

        return {
          ...q.toObject?.() || q,
          attemptResponse: response || null
        };
      });

      return {
        ...test.toObject?.() || test,
        questions: questionsWithAttempts,
        attempt: latestAttempt
          ? {
            totalMarks: latestAttempt.totalMarks,
            correctCount: latestAttempt.correctCount,
            wrongCount: latestAttempt.wrongCount,
            unattemptedCount: latestAttempt.unattemptedCount,
            createdAt: latestAttempt.createdAt
          }
          : null
      };
    });

    return res.json({
      success: true,
      data: {
        ...series.toObject(),
        tests: testsWithAttempts, // ab har test ke andar attempt + merged questions honge
        attempts: undefined // original attempts array chhupane ke liye
      }
    });
  } catch (e) {
    console.error("ERROR in getAnswerSheet:", e?.stack || e);
    return res.status(500).json({ message: e.message || "Internal Server Error" });
  }
};

exports.getRanking = async (req, res) => {
  try {
    const { testSeriesId, testId, attemptId } = req.params;
    const userId = req.user._id;

    // 1️⃣ Find series
    const series = await TestSeries.findById(testSeriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }

    // 2️⃣ Filter attempts for this test only
    const testAttempts = (series.attempts || []).filter(
      (a) =>
        a.test_id?.toString() === testId.toString() &&
        a.status === "submitted"
    );

    if (testAttempts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No submitted attempts found for this test",
      });
    }

    // 3️⃣ Sort by marks (highest first)
    const sorted = testAttempts.sort((a, b) => b.totalMarks - a.totalMarks);

    // 4️⃣ Assign rank
    const ranking = sorted.map((a, index) => ({
      rank: index + 1,
      user_id: a.user_id,
      marks: a.totalMarks,
      attemptId: a._id,
    }));

    // 5️⃣ Find rank for current attempt
    const currentAttempt = ranking.find(
      (r) => r.attemptId.toString() === attemptId.toString()
    );

    return res.status(200).json({
      success: true,
      message: "Ranking fetched successfully",
      totalParticipants: testAttempts.length,
      currentRank: currentAttempt?.rank || null,
      ranking,
    });
  } catch (error) {
    console.error("Error in getRanking:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteEmbeddedTest = async (req, res) => {
  const RID = sid(); // unique log id
  const log = (...args) => console.log(`[deleteEmbeddedTest:${RID}]`, ...args);

  try {
    const { seriesId, testId } = req.params;

    log("Received params:", { seriesId, testId });

    if (!seriesId || !testId)
      return res.status(400).json({ success: false, message: "seriesId and testId are required" });

    // Validate IDs
    const validSeries = mongoose.Types.ObjectId.isValid(seriesId);
    const validTest = mongoose.Types.ObjectId.isValid(testId);
    if (!validSeries || !validTest)
      return res.status(400).json({ success: false, message: "Invalid seriesId or testId" });

    // Find TestSeries
    const series = await TestSeries.findById(seriesId);
    if (!series)
      return res.status(404).json({ success: false, message: "Test Series not found" });

    log("Series found:", series.title);

    // Ensure tests exist
    if (!Array.isArray(series.tests) || series.tests.length === 0)
      return res.status(404).json({ success: false, message: "No tests found in this series" });

    // Find test index
    const index = series.tests.findIndex(t => t._id.toString() === testId.toString());
    if (index === -1)
      return res.status(404).json({ success: false, message: "Test not found in this series" });

    // Remove it
    series.tests.splice(index, 1);
    await series.save();

    log(`Test with ID ${testId} deleted successfully`);

    return res.status(200).json({
      success: true,
      message: "Test deleted successfully",
      deletedTestId: testId
    });

  } catch (error) {
    console.error(`[deleteEmbeddedTest:${RID}] ERROR:`, error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  } finally {
    console.log(`[deleteEmbeddedTest:${RID}] ----- END -----`);
  }
};
