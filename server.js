const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend access
app.use(cors());

// Serve static files (images, etc.)
app.use("/static", express.static("static"));

/**
 * ✅ MAIN API: GET /get-page
 * Returns the image + questions for a specific page and type
 */
app.get("/get-page", (req, res) => {
  const { book, class: className, chapter, page, type } = req.query;

  // Validate query parameters
  if (!book || !className || !chapter || !page || !type) {
    return res.status(400).json({
      status: "error",
      message: "Missing required query params: book, class, chapter, page, or type",
    });
  }

  const basePath = path.join(__dirname, "static", book, className, chapter);
  const questionsFile = `${type}.json`; // e.g., mcq.json
  const questionsFilePath = path.join(basePath, questionsFile);
  const imageFileName = `page${page}.jpg`;
  const imageFilePath = path.join(basePath, imageFileName);

  // 🔍 Debug logs
  console.log("📁 Base path:", basePath);
  console.log("📄 Looking for file:", questionsFile);
  console.log("📄 File exists:", fs.existsSync(questionsFilePath));
  console.log("🖼️ Image exists:", fs.existsSync(imageFilePath));

  // Check if files exist
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

  // Read and parse JSON
  let questionsJson;
  try {
    const raw = fs.readFileSync(questionsFilePath, "utf-8");
    questionsJson = JSON.parse(raw);
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: `Invalid JSON format in ${questionsFile}`,
    });
  }

  // Get questions for the given page (index starts at 1)
  const pageIndex = parseInt(page, 10) - 1;
  const pageQuestions = questionsJson[pageIndex] || [];

  return res.json({
    status: "success",
    data: {
      image_url: `/static/${book}/${className}/${chapter}/${imageFileName}`,
      questions: pageQuestions,
      page: parseInt(page),
      type,
    },
  });
});

/**
 * ✅ DEBUG API: GET /debug-questions
 * Returns list of files in the chapter directory + metadata
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

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});


































































































































































