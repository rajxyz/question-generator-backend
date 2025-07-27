const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use("/static", express.static("static"));

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

  // 🔁 Dynamic filename based on type and page — e.g., mcqpage1.json
  const questionsFile = `${type}page${page}.json`;
  const questionsFilePath = path.join(basePath, questionsFile);

  const imageFileName = `page${page}.jpg`;
  const imageFilePath = path.join(basePath, imageFileName);

  console.log("📁 Base path:", basePath);
  console.log("📄 Looking for file:", questionsFile);
  console.log("📄 File exists:", fs.existsSync(questionsFilePath));
  console.log("🖼️ Image exists:", fs.existsSync(imageFilePath));

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

  let pageQuestions = [];
  try {
    const raw = fs.readFileSync(questionsFilePath, "utf-8");
    const questionsJson = JSON.parse(raw);

    // The file itself is assumed to be an array of questions
    if (Array.isArray(questionsJson)) {
      pageQuestions = questionsJson;
    } else if (questionsJson.questions && Array.isArray(questionsJson.questions)) {
      pageQuestions = questionsJson.questions;
    } else {
      throw new Error("Unsupported JSON format");
    }
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: `Invalid JSON format or file error in ${questionsFile}`,
    });
  }

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
 * Debug endpoint for inspecting files in a chapter folder
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
