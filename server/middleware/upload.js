const multer = require('multer');

// Store the file in memory (buffer) since we only need to extract text, not keep the raw file
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB cap - adjust if lecture PDFs run larger
});

module.exports = upload;
