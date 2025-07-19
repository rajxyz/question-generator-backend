// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files (like images)
app.use("/static", express.static("static"));

// API: GET /get-page?book=ncert&class=class11_biology&chapter=chapter_01&page=1&type=mcq
app.get("/get-page", (req, res) => {
  const { book, class: className, chapter, page, type } = req.query;

  // Validate query parameters
  if (!book || !className || !chapter || !page) {
    return res.status(400).json({
      status: "error",
      message: "Missing required query parameters: book, class, chapter, page"
    });
  }

  // Construct paths
  const basePath = path.join(__dirname, "static", book, className, chapter);
  const questionsFilePath = path.join(basePath, "questions.json");
  const imageFileName = `page${page}.jpg`;
  const imageFilePath = path.join(basePath, imageFileName);

  // Check if questions.json exists
  if (!fs.existsSync(questionsFilePath)) {
    return res.status(404).json({ status: "error", message: "questions.json not found." });
  }

  // Check if page image exists
  if (!fs.existsSync(imageFilePath)) {
    return res.status(404).json({ status: "error", message: `Image for page ${page} not found.` });
  }

  // Read and parse questions.json
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

  // Filter questions by type (optional)
  let filteredQuestions = pageData.questions;
  if (type) {
    filteredQuestions = filteredQuestions.filter(q => q.type === type);
  }

  // Final response
  return res.json({
    status: "success",
    data: {
      image_url: `/static/${book}/${className}/${chapter}/${imageFileName}`,
      questions: filteredQuestions
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
