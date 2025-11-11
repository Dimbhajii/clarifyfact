const pdf = require('pdf-parse');
const fs = require('fs');

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text from PDF
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from multiple PDF files
 * @param {Array<string>} filePaths - Array of PDF file paths
 * @returns {Promise<string>} Combined text from all PDFs
 */
async function extractTextFromPDFs(filePaths) {
  try {
    const extractedTexts = await Promise.all(
      filePaths.map(filePath => extractTextFromPDF(filePath))
    );
    
    // Combine all texts with separators
    return extractedTexts
      .map((text, index) => `--- Document ${index + 1} ---\n${text}`)
      .join('\n\n');
  } catch (error) {
    console.error('Error extracting text from PDFs:', error);
    throw new Error(`Failed to extract text from PDFs: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF,
  extractTextFromPDFs,
};

