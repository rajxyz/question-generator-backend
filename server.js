const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors());

// Serve static files from /static
app.use("/static", express.static("static"));

// ✅ Main API: /get-page
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

  // ✅ DEBUG LOGS
  console.log("📁 Base path:", basePath);
  console.log("📄 Resolved questionsFilePath:", questionsFilePath);
  console.log("✅ questions.json exists:", fs.existsSync(questionsFilePath));
  console.log("🖼️ Image exists:", fs.existsSync(imageFilePath));

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


// ✅ Route: /debug-questions → Check file presence + size
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


// ✅ Route: /list-static → List files under static/ folder
app.get("/list-static", (req, res) => {
  const dirPath = path.join(__dirname, "static");

  function listFilesRecursive(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    return files.map(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        return { folder: file, contents: listFilesRecursive(fullPath) };
      } else {
        return file;
      }
    });
  }

  const structure = listFilesRecursive(dirPath);
  res.json({ status: "success", structure });
});


// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});


























































































