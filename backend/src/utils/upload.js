/**
 * Image Upload Utility
 *
 * Configures multer for multipart/form-data uploads and uses sharp to
 * resize/compress images before saving them to the Railway Volume.
 *
 * All images are converted to WebP format for consistent quality and small sizes.
 *
 * Supported upload types:
 *  - agency logo:  max 800px wide, quality 85
 *  - client logo:  400x400px cover crop, quality 85
 *  - user avatar:  256x256px cover crop, quality 85
 */

const multer = require('multer');
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

// Use memory storage — we process the buffer with sharp before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max upload
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  },
});

const uploadsPath = () => process.env.UPLOADS_PATH || path.join(__dirname, '..', '..', 'uploads');

/**
 * Process and save an uploaded image.
 * @param {Buffer} buffer    - Raw image buffer from multer
 * @param {string} subDir    - Subdirectory: 'agency', 'clients', or 'avatars'
 * @param {string} filename  - Output filename (without extension)
 * @param {string} type      - 'agency' | 'client' | 'avatar'
 * @returns {string} Relative URL path, e.g. /uploads/clients/uuid.webp
 */
async function processAndSaveImage(buffer, subDir, filename, type) {
  const dir = path.join(uploadsPath(), subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const outputPath = path.join(dir, `${filename}.webp`);

  let sharpInstance = sharp(buffer);

  if (type === 'agency') {
    // Max 800px wide, maintain aspect ratio
    sharpInstance = sharpInstance.resize(800, null, { withoutEnlargement: true });
  } else if (type === 'client') {
    // 400x400px cover crop (center)
    sharpInstance = sharpInstance.resize(400, 400, { fit: 'cover', position: 'centre' });
  } else if (type === 'avatar') {
    // 256x256px cover crop (center)
    sharpInstance = sharpInstance.resize(256, 256, { fit: 'cover', position: 'centre' });
  }

  await sharpInstance.webp({ quality: 85 }).toFile(outputPath);

  return `/uploads/${subDir}/${filename}.webp`;
}

/**
 * Delete an existing image file from disk.
 * @param {string} relativeUrl - e.g. /uploads/clients/uuid.webp
 */
function deleteImage(relativeUrl) {
  if (!relativeUrl) return;
  try {
    const fullPath = path.join(uploadsPath(), relativeUrl.replace('/uploads/', ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Failed to delete image:', err.message);
  }
}

module.exports = { upload, processAndSaveImage, deleteImage };
