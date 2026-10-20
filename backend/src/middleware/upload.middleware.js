const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');
const tracksDir = path.join(uploadsDir, 'tracks');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(tracksDir)) fs.mkdirSync(tracksDir, { recursive: true });

// Storage for Images (avatars, banners, playlist covers)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Storage for Local Audio Tracks on Disk
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tracksDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `track-${uniqueSuffix}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) && (allowedMimeTypes.includes(file.mimetype.toLowerCase()) || file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Supported: PNG, JPG, WebP, GIF.'));
  }
};

const audioFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.opus'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid audio file type. Supported: MP3, WAV, FLAC, OGG, M4A.'));
  }
};

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: imageFileFilter
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB max per audio track
  fileFilter: audioFileFilter
});

// Clean wrapper for image upload
const uploadSingleImage = (fieldName = 'image') => {
  return (req, res, next) => {
    imageUpload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 8 MB limit.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

// Clean wrapper for audio track upload
const uploadSingleAudio = (fieldName = 'audio') => {
  return (req, res, next) => {
    audioUpload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Audio file exceeds 150 MB limit.' });
        }
        return res.status(400).json({ error: `Audio upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

module.exports = {
  upload: imageUpload,
  uploadSingleImage,
  uploadSingleAudio
};
