const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Dynamic port for Render

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
      message: "Missing required query parameters: book, class, chapter, page"
    });
  }

  const basePath = path.join(__dirname, "static", book, className, chapter);
  const questionsFilePath = path.join(basePath, "questions.json");
  const imageFileName = `page${page}.jpg`;
  const imageFilePath = path.join(basePath, imageFileName);

  if (!fs.existsSync(questionsFilePath)) {
    return res.status(404).json({ status: "error", message: "questions.json not found." });
  }

  if (!fs.existsSync(imageFilePath)) {
    return res.status(404).json({ status: "error", message: `Image for page ${page} not found.` });
  }

  let rawData = fs.readFileSync(questionsFilePath, "utf-8");
  let questionsJson;
  try {
    questionsJson = JSON.parse(rawData);
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Invalid JSON format." });
  }

  const pageData = questionsJson.pages?.[page];
  if (!pageData) {
    return res.status(404).json({ status: "error", message: `No data for page ${page}` });
  }

  let filteredQuestions = pageData.questions;
  if (type) {
    filteredQuestions = filteredQuestions.filter(q => q.type === type);
  }

  return res.json({
    status: "success",
    data: {
      image_url: `/static/${book}/${className}/${chapter}/${imageFileName}`,
      questions: filteredQuestions
    }
  });
});


// ✅ DEBUG ROUTE
app.get("/debug-questions", (req, res) => {
  const { book, class: className, chapter } = req.query;

  if (!book || !className || !chapter) {
    return res.status(400).json({
      status: "error",
      message: "Missing book, class, or chapter"
    });
  }

  const questionsPath = path.join(
    __dirname,
    "static",
    book,
    className,
    chapter,
    "questions.json"
  );

  const fileExists = fs.existsSync(questionsPath);
  const fileSize = fileExists ? fs.statSync(questionsPath).size : null;

  res.json({
    status: "success",
    exists: fileExists,
    fullPath: questionsPath,
    fileSize,
    baseDir: __dirname
  });
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});












