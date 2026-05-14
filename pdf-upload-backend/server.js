require('dotenv').config();
const express  = require('express');
const multer   = require('multer');
const cors     = require('cors');
const path     = require('path');
const { uploadToBlob } = require('./services/blobService');
const { saveMetadata } = require('./services/sqlService');

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf')
      return res.status(400).json({ error: 'Only PDF files are accepted' });

    const blobUrl = await uploadToBlob(req.file);
    await saveMetadata({ name: req.file.originalname, sizeBytes: req.file.size, blobUrl });

    res.status(201).json({ message: 'Upload successful', blobUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`));
