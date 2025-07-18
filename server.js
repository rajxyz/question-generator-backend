const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('static')); // Serve images + JSON

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
    .filter(file => file.endsWith('.jpg'))
    .sort();

  res.json({ images, questions });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
