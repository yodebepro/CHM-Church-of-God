require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { Storage } = require('@google-cloud/storage');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 200) * 1024 * 1024 }
});

const bucketName = process.env.GCS_BUCKET || 'chmnetwork';
const publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL || `https://storage.googleapis.com/${bucketName}`;

// Use GOOGLE_APPLICATION_CREDENTIALS=/private/path/to/your-service-account.json
// OR use GCS_KEY_JSON as the full JSON string in your hosting environment.
let storage;
if (process.env.GCS_KEY_JSON) {
  storage = new Storage({ credentials: JSON.parse(process.env.GCS_KEY_JSON) });
} else {
  storage = new Storage();
}

const bucket = storage.bucket(bucketName);

function safeName(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = path.basename(originalName || 'file', ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'file';
  return `uploads/${new Date().toISOString().slice(0,10)}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${base}${ext}`;
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const objectName = safeName(req.file.originalname);
    const blob = bucket.file(objectName);

    await blob.save(req.file.buffer, {
      resumable: false,
      metadata: {
        contentType: req.file.mimetype || 'application/octet-stream',
        cacheControl: 'public, max-age=31536000'
      }
    });

    // This requires the bucket/object to allow public access.
    // If your bucket blocks public access, disable public access prevention
    // OR remove this line and use a backend proxy instead.
    try { await blob.makePublic(); } catch (e) {}

    res.json({
      ok: true,
      bucket: bucketName,
      path: objectName,
      url: `${publicBaseUrl}/${encodeURIComponent(objectName).replace(/%2F/g, '/')}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Upload failed.' });
  }
});

app.use(express.static(__dirname));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`CHM CMS running on http://localhost:${port}`));
