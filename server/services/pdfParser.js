const pdfParse = require('pdf-parse');

// Extracts plain text (and page count) from a PDF buffer uploaded via multer
async function extractTextFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return {
    text: data.text.trim(),
    pageCount: data.numpages
  };
}

module.exports = { extractTextFromPdf };
