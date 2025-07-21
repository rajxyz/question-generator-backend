const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // Dynamic port for Render

// Enable CORS (for frontend access)
app.use(cors());

// Serve static files
app.use("/static", express.static("static"));

// ✅ Main API: GET /get-page
app.get("/get-page", (req, res) => {
  const { book, class: className, chapter, page, type } = req.query;

  if (!book || !className || !chapter || !page) {
    return res.status(400).json({
      status: "error",
      message: "Missing required query parameters: book, class, chapter, page",
    });
  }

  const basePath = path.join(__dirname, "static", book, className, chapter);
  const questionsFilePath = path.join(basePath, "questions.json");
  const imageFileName = `page${page}.jpg`;
  const imageFilePath = path.join(basePath, imageFileName);

  // 🔍 DEBUG LOGS
  console.log("📁 Base path:", basePath);
  console.log("📄 Resolved questionsFilePath:", questionsFilePath);
  console.log("✅ questions.json exists:", fs.existsSync(questionsFilePath));
  console.log("🖼️ Image exists:", fs.existsSync(imageFilePath));

  if (!fs.existsSync(questionsFilePath)) {
    return res.status(404).json({
      status: "error",
      message: "questions.json not found.",
      fullPath: questionsFilePath,
    });
  }

  if (!fs.existsSync(imageFilePath)) {
    return res.status(404).json({
      status: "error",
      message: `Image for page ${page} not found.`,
    });
  }

  let rawData = fs.readFileSync(questionsFilePath, "utf-8");
  let questionsJson;
  try {
    questionsJson = JSON.parse(rawData);
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Invalid JSON format.",
    });
  }

  const pageData = questionsJson.pages?.[page];
  if (!pageData) {
    return res.status(404).json({
      status: "error",
      message: `No data for page ${page}`,
    });
  }

  let filteredQuestions = pageData.questions;
  if (type) {
    filteredQuestions = filteredQuestions.filter((q) => q.type === type);
  }

  return res.json({
    status: "success",
    data: {
      image_url: `/static/${book}/${className}/${chapter}/${imageFileName}`,
      questions: filteredQuestions,
    },
  });
});

// ✅ DEBUG ROUTE: checks if file exists and what’s inside the directory
app.get("/debug-questions", (req, res) => {
  const { book, class: className, chapter } = req.query;

  if (!book || !className || !chapter) {
    return res.status(400).json({
      status: "error",
      message: "Missing book, class, or chapter",
    });
  }

  const chapterDir = path.join(__dirname, "static", book, className, chapter);
  const questionsPath = path.join(chapterDir, "questions.json");

  let fileExists = false;
  let fileSize = null;
  let fileStat = null;
  let dirExists = false;
  let dirContents = [];
  let gitignoreContents = null;
  let permissions = null;

  try {
    dirExists = fs.existsSync(chapterDir);
    if (dirExists) {
      dirContents = fs.readdirSync(chapterDir);
    }

    fileExists = fs.existsSync(questionsPath);
    if (fileExists) {
      fileStat = fs.statSync(questionsPath);
      fileSize = fileStat.size;
      permissions = (fileStat.mode & 0o777).toString(8);
    }

    const gitignorePath = path.join(__dirname, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      gitignoreContents = fs.readFileSync(gitignorePath, "utf-8");
    }
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }

  res.json({
    status: "success",
    fileExists,
    fileSize,
    fullPath: questionsPath,
    baseDir: __dirname,
    dirExists,
    dirContents,
    permissions,
    gitignore: gitignoreContents,
  });
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
}); ek










































































































