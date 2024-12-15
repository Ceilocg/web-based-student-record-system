import express, { Request, Response, NextFunction } from 'express';
import { initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin'; 
import { getStorage } from 'firebase-admin/storage';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


// Ensure the Firebase private key is defined
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey || !privateKey.includes("-----BEGIN PRIVATE KEY-----") || !privateKey.includes("-----END PRIVATE KEY-----")) {
  throw new Error("Invalid or missing FIREBASE_PRIVATE_KEY environment variable.");
}

const firebaseConfig = {
  credential: credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};


initializeApp(firebaseConfig);

const bucket = getStorage().bucket();
const app = express();

app.use(express.json());
app.use(cors());

// Middleware for logging requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Utility function for error handling
const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error);
  res.status(500).json({ error: message, details: error.message || error });
};

// POST /generate-pdf - Generate a certificate PDF and upload to Firebase Storage
app.post('/generate-pdf', async (req: Request, res: Response): Promise<void> => {
  const { fullName, schoolYear, date } = req.body;

  // Validate request body
  if (!fullName || !schoolYear || !date) {
    res.status(400).json({ error: 'All fields (fullName, schoolYear, date) are required.' });
    return;
  }

  try {
    const templateFilePath = 'Template/Certificate-of-Enrollment-template2.pdf';
    console.log(`Fetching template from Firebase Storage: ${templateFilePath}`);
    const [templateFile] = await bucket.file(templateFilePath).download();

    console.log('Loading PDF template...');
    const pdfDoc = await PDFDocument.load(templateFile);

    // Embed font for dynamic text replacement
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Overlay text on the PDF in place of placeholders
    firstPage.drawText(fullName, { x: 245, y: 378, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(schoolYear, { x: 165, y: 351, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(date, { x: 450, y: 443, size: 12, font, color: rgb(0, 0, 0) });

    // Save the updated PDF
    const pdfBytes = await pdfDoc.save();

    console.log('Saving generated PDF to Firebase Storage...');
    const fileName = `generated/${fullName.replace(/ /g, '_')}_${Date.now()}.pdf`;
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({ metadata: { contentType: 'application/pdf' } });

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.end(pdfBytes);
    });

    console.log(`Certificate saved successfully: ${fileName}`);
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.status(200).json({ message: 'Certificate generated and saved successfully.', fileName, downloadUrl });
  } catch (error) {
    handleError(res, error, 'Failed to generate and save the PDF.');
  }
});

// GET /generate-signed-url - Generate a signed URL for a file
app.get('/generate-signed-url', async (req: Request, res: Response) => {
  const { fileName } = req.query;

  if (!fileName || typeof fileName !== 'string') {
    res.status(400).json({ error: 'Valid fileName query parameter is required.' });
    return;
  }

  try {
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // URL valid for 15 minutes
    });

    res.status(200).json({ url });
  } catch (error) {
    handleError(res, error, `Failed to generate signed URL for file: ${fileName}`);
  }
});

// Health Check Endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({ status: 'Server is healthy and running!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
