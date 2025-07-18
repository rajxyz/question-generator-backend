const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('static')); // Serve images + JSON

// 👉 Route: Get questions + image for given book/chapter/type/page
app.get('/questions', (req, res) => {
  const { classNum, chapter, type, page } = req.query;

  if (!classNum || !chapter || !type) {
    return res.status(400).json({ error: 'Missing classNum, chapter, or type' });
  }

  const chapterPath = path.join(__dirname, 'static', 'ncert', `class${classNum}_biology`, chapter);
  const questionsPath = path.join(chapterPath, 'questions.json');

  // Check if file exists
  if (!fs.existsSync(questionsPath)) {
    return res.status(404).json({ error: 'No questions found' });
  }

  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  // Check type exists (e.g., "mcq", "short", etc.)
  if (!questionsData[type]) {
    return res.status(404).json({ error: 'Invalid question type' });
  }

  const questionPages = questionsData[type]; // Array of arrays (each page)
  const currentPage = parseInt(page) || 0;

  if (currentPage < 0 || currentPage >= questionPages.length) {
    return res.status(404).json({ error: 'Page out of range' });
  }

  // Construct image path (e.g., page1.jpg, page2.jpg)
  const imageName = `page${currentPage + 1}.jpg`;
  const imagePath = path.join(chapterPath, imageName);

  const imageExists = fs.existsSync(imagePath);

  res.json({
    questions: questionPages[currentPage],
    currentPage,
    totalPages: questionPages.length,
    image: imageExists ? `/ncert/class${classNum}_biology/${chapter}/${imageName}` : null
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
