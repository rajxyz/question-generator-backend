const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use("/static", express.static("static"));

/**
 * 🔧 Smart universal question extractor for all formats and types
 */
function extractAllQuestions(json, type) {
  if (!json || typeof json !== "object") return [];

  // Case 1: JSON is directly an array
  if (Array.isArray(json)) return json;

  // Case 2: JSON has a key like "questions"
  if (json.questions && Array.isArray(json.questions)) return json.questions;

  // Case 3: JSON has separate keys for each question type like mcq, ar, etc.
  if (json[type] && Array.isArray(json[type])) return json[type];

  // Case 4: Collect all arrays under any key (fallback)
  const all = [];
  for (const key in json) {
    if (Array.isArray(json[key])) {
      all.push(...json[key]);
    }
  }

  return all;
}

/**
 * GET /get-page — Returns image and questions for a specific page and type
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

  // Debug logs
  console.log("📁 Base path:", basePath);
  console.log("📄 Looking for file:", questionsFile);
  console.log("📄 File exists:", fs.existsSync(questionsFilePath));
  console.log("🖼️ Image exists:", fs.existsSync(imageFilePath));

  // File not found checks
  if (!fs.existsSync(questionsFilePath)) {
    return res.status(404).json({
      status: "error",
      message: `${questionsFile} not found.`,
    });
  }

  if (!fs.existsSync(imageFilePath)) {
    return res.status(404).json({
      status: "error",
      message: `Image for page ${page} not found.`,
    });
  }

  // Load and parse question JSON
  let pageQuestions = [];
  try {
    const raw = fs.readFileSync(questionsFilePath, "utf-8");
    const questionsJson = JSON.parse(raw);
    pageQuestions = extractAllQuestions(questionsJson, type.toLowerCase());
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: `Invalid JSON format or file error in ${questionsFile}`,
    });
  }

  // Success response
  return res.json({
    status: "success",
    data: {
      image_url: `${req.protocol}://${req.get("host")}/static/${book}/${className}/${chapter}/${imageFileName}`,
      questions: pageQuestions,
      page: parseInt(page),
      type,
    },
  });
});

/**
 * 🔍 Debug endpoint for inspecting all files in a chapter folder
 */
app.get("/debug-questions", (req, res) => {
  const { book, class: className, chapter } = req.query;

  if (!book || !className || !chapter) {
    return res.status(400).json({
      status: "error",
      message: "Missing book, class, or chapter",
    });
  }

  const chapterDir = path.join(__dirname, "static", book, className, chapter);

  try {
    if (!fs.existsSync(chapterDir)) {
      return res.status(404).json({
        status: "error",
        message: "Chapter directory not found",
      });
    }

    const files = fs.readdirSync(chapterDir).map((file) => {
      const fullPath = path.join(chapterDir, file);
      const stat = fs.statSync(fullPath);
      return {
        name: file,
        size: stat.size,
        type: path.extname(file),
      };
    });

    return res.json({
      status: "success",
      chapterDir,
      files,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
