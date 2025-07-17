const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/questions', (req, res) => {
  const { book, chapter, type } = req.query;

  if (!book || !chapter || !type) {
    return res.status(400).json({ error: 'Missing book, chapter, or question type' });
  }

  const filePath = path.join(__dirname, 'data', book, `${chapter}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Chapter not found' });
  }

  const chapterData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const filtered = chapterData.filter(q => q.type === type);

  res.json(filtered);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
