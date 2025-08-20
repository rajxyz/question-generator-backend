const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use("/static", express.static("static"));

/**
 * 🔧 Extract questions from JSON
 */
function extractAllQuestions(json, type) {
  if (!json || typeof json !== "object") return [];
  if (Array.isArray(json)) return json;
  if (json.questions && Array.isArray(json.questions)) return json.questions;
  if (json[type] && Array.isArray(json[type])) return json[type];

  const all = [];
  for (const key in json) {
    if (Array.isArray(json[key])) {
      all.push(...json[key]);
    }
  }
  return all;
}

/**
 * 🛠 Sanitize and normalize question formats
 */
function sanitizeQuestions(questions, type) {
  return questions.map(q => {
    if (type === "ar_questions") {
      return {
        assertion: q.assertion || "",
        reason: q.reason || "",
        options: Array.isArray(q.options) ? q.options : [],
        answer: q.answer || ""
      };
    }

    if (type === "match") {
      if (Array.isArray(q.matches) && q.matches.every(m => typeof m === "string")) {
        q.matches = q.matches.map(matchStr => {
          const [leftCode, rightCode] = matchStr.split("–");
          let leftText = "";
          let rightText = "";

          if (Array.isArray(q.column_I)) {
            const idx = q.column_I.findIndex(item => item.startsWith(leftCode));
            if (idx !== -1) leftText = q.column_I[idx];
          }
          if (Array.isArray(q.column_II)) {
            const idx = q.column_II.findIndex(item => item.startsWith(rightCode));
            if (idx !== -1) rightText = q.column_II[idx];
          }

          return { left: leftText, right: rightText };
        });
      }

      if (Array.isArray(q.matches) && q.matches.every(m => typeof m === "object")) {
        q.matches = q.matches.map(pair => ({
          left: pair.left || "",
          right: pair.right || ""
        }));
      }

      return q;
    }

    return q;
  });
}

/**
 * GET /get-page — Returns image and questions
 */
app.get("/get-page", (req, res) => {
  const { book, class: className, chapter, page, type } = req.query;

  if (!book || !className || !chapter || !page || !type) {
    return res.status(400).json({
      status: "error",
      message: "Missing required query params: book, class, chapter, page, or type",
    });
  }

  const basePath = path.join(__dirname, "static", book, className, chapter);
  const questionsFile = `${type}page${page}.json`;
  const questionsFilePath = path.join(basePath, questionsFile);
  const imageFileName = `page${page}.jpg`;
  const imageFilePath = path.join(basePath, imageFileName);

  console.log("📁 Base path:", basePath);
  console.log("📄 JSON file exists:", fs.existsSync(questionsFilePath));
  console.log("🖼️ Image exists:", fs.existsSync(imageFilePath));

  // Load JSON
  let pageQuestions = [];
  if (fs.existsSync(questionsFilePath)) {
    try {
      const raw = fs.readFileSync(questionsFilePath, "utf-8");
      const questionsJson = JSON.parse(raw);
      pageQuestions = extractAllQuestions(questionsJson, type.toLowerCase());
      pageQuestions = sanitizeQuestions(pageQuestions, type.toLowerCase());
    } catch (err) {
      console.error("⚠️ JSON parse error:", err.message);
    }
  } else {
    console.warn(`⚠️ JSON file ${questionsFile} not found, returning empty questions`);
  }

  // Load Image
  let imageUrl;
  if (fs.existsSync(imageFilePath)) {
    imageUrl = `${req.protocol}://${req.get("host")}/static/${book}/${className}/${chapter}/${imageFileName}`;
  } else {
    console.warn(`⚠️ Image file ${imageFileName} not found, using placeholder`);
    imageUrl = `${req.protocol}://${req.get("host")}/static/placeholder.jpg`; // make sure placeholder exists
  }

  res.json({
    status: "success",
    data: {
      image_url: imageUrl,
      questions: pageQuestions,
      page: parseInt(page),
      type,
    },
  });
});

/**
 * Debug endpoint — see all files in chapter
 */
app.get("/debug-questions", (req, res) => {
  const { book, class: className, chapter } = req.query;
  if (!book || !className || !chapter) {
    return res.status(400).json({ status: "error", message: "Missing book, class, or chapter" });
  }

  const chapterDir = path.join(__dirname, "static", book, className, chapter);

  try {
    if (!fs.existsSync(chapterDir)) {
      return res.status(404).json({ status: "error", message: "Chapter directory not found" });
    }
    const files = fs.readdirSync(chapterDir).map(file => {
      const stat = fs.statSync(path.join(chapterDir, file));
      return { name: file, size: stat.size, type: path.extname(file) };
    });
    return res.json({ status: "success", chapterDir, files });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});





















