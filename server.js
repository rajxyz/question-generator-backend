const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.static('static')); // Serve static files (images + json)

// 🧾 Get all images & full questions
app.get('/chapter', (req, res) => {
  const { classNum, chapter } = req.query;

  if (!classNum || !chapter) {
    return res.status(400).json({ error: 'Missing classNum or chapter' });
  }

  const chapterPath = path.join(__dirname, 'static', 'ncert', `class${classNum}_biology`, chapter);
  const questionsPath = path.join(chapterPath, 'questions.json');

  if (!fs.existsSync(questionsPath)) {
    return res.status(404).json({ error: 'No questions found' });
  }

  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const images = fs.readdirSync(chapterPath)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
    .sort();

  res.json({ images, questions });
});

// 🎯 Filtered + paginated questions endpoint
app.get('/questions', (req, res) => {
  const { classNum, chapter, type = "all", page = 0 } = req.query;

  if (!classNum || !chapter) {
    return res.status(400).json({ error: "Missing classNum or chapter" });
  }

  const chapterFolder = `chapter_${String(chapter).padStart(2, '0')}`;
  const filePath = path.join(
    __dirname,
    'static',
    'ncert',
    `class${classNum}_biology`,
    chapterFolder,
    'questions.json'
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Questions file not found' });
  }

  const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const filtered = type === 'all' ? questions : questions.filter(q => q.type === type);

  const pageSize = 5;
  const start = parseInt(page) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  res.json({
    questions: paginated,
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / pageSize),
    image: `ncert/class${classNum}_biology/${chapterFolder}/page${parseInt(page) + 1}.jpg`
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
