const fs = require("fs");
const pdf = require("pdf-parse/lib/pdf-parse");   // IMPORTANT

async function extractDelhiAqiFromPdf(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdf(buffer);

  const text = data.text.replace(/\s+/g, " ");

  const match =
    text.match(/Delhi\s+\w+\s+(\d{2,3})\s*PM/i) ||
    text.match(/Delhi[^0-9]+(\d{2,3})/i);

  return match ? parseInt(match[1], 10) : null;
}

module.exports = { extractDelhiAqiFromPdf };
