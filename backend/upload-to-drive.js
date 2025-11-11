// Backend API endpoint to upload files to YOUR Google Drive
// This should be deployed as a serverless function or backend API

const { google } = require('googleapis');
const formidable = require('formidable');
const fs = require('fs');
const { extractTextFromPDFs } = require('./services/pdfExtractor');

// Service Account Configuration
// Download your service account JSON from Google Cloud Console
const KEYFILE_PATH = './service-account-key.json'; // Path to your service account key
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function uploadToDrive(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Check if service account key exists
  if (!fs.existsSync(KEYFILE_PATH)) {
    console.warn('⚠️  Google Drive service account key not found. Upload feature disabled.');
    console.warn('   To enable: Create service-account-key.json in backend directory');
    res.status(503).json({
      error: 'Google Drive upload not configured',
      message: 'Service account key file not found. Please configure Google Drive upload.',
      details: 'See backend/README.md for setup instructions'
    });
    return;
  }

  try {
    // Parse form data
    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        res.status(500).json({ error: 'Failed to parse upload' });
        return;
      }

      // Authenticate with Google Drive using service account
      const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILE_PATH,
        scopes: SCOPES,
      });

      const drive = google.drive({ version: 'v3', auth });

      // Create a folder for ClarifyFact uploads (optional)
      const folderName = 'ClarifyFact Student Uploads';
      let folderId;

      // Check if folder exists, if not create it
      const folderSearch = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id;
      } else {
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        };
        const folder = await drive.files.create({
          resource: folderMetadata,
          fields: 'id',
        });
        folderId = folder.data.id;
      }

      // Extract text from PDFs before uploading
      const uploadedFiles = Object.keys(files).filter(key => key.startsWith('file'));
      const filePaths = uploadedFiles.map(key => files[key].filepath || files[key].path);
      
      let extractedText = '';
      try {
        extractedText = await extractTextFromPDFs(filePaths);
      } catch (error) {
        console.error('Error extracting text from PDFs:', error);
        // Continue with upload even if text extraction fails
      }

      // Upload all files
      const fileIds = [];

      for (const key of uploadedFiles) {
        const file = files[key];
        
        const fileMetadata = {
          name: file.originalFilename || file.name,
          parents: [folderId], // Upload to the ClarifyFact folder
        };

        const media = {
          mimeType: file.mimetype || 'application/pdf',
          body: fs.createReadStream(file.filepath || file.path),
        };

        const response = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, name, webViewLink',
        });

        fileIds.push({
          id: response.data.id,
          name: response.data.name,
          link: response.data.webViewLink,
        });

        // Clean up temp file
        fs.unlinkSync(file.filepath || file.path);
      }

      res.status(200).json({
        success: true,
        fileIds: fileIds.map(f => f.id),
        files: fileIds,
        extractedText: extractedText, // Include extracted text in response
        message: `Successfully uploaded ${fileIds.length} file(s) to Google Drive`,
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload to Google Drive',
      details: error.message,
    });
  }
}

module.exports = uploadToDrive;

