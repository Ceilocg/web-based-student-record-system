import { Router, Request, Response } from 'express';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { bucket } from '../app';

const router = Router();

router.post('/generate-pdf', async (req: Request, res: Response): Promise<void> => {
  const { fullName, schoolYear, date } = req.body;

  if (!fullName || !schoolYear || !date) {
    res.status(400).json({ error: 'All fields (fullName, schoolYear, date) are required.' });
    return;
  }

  try {
    // Download PDF template
    const [templateFile] = await bucket.file('Template/Certificate-of-Enrollment-template2.pdf').download();
    const pdfDoc = await PDFDocument.load(templateFile);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw text on the PDF
    const firstPage = pdfDoc.getPages()[0];
    firstPage.drawText(fullName, { x: 245, y: 378, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(schoolYear, { x: 165, y: 351, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(date, { x: 450, y: 443, size: 12, font, color: rgb(0, 0, 0) });

    // Save the updated PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `generated/${fullName.replace(/ /g, '_')}_${Date.now()}.pdf`;
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({ metadata: { contentType: 'application/pdf' } });
    stream.end(pdfBytes);

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.status(200).json({ message: 'PDF generated successfully', downloadUrl });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate the PDF.' });
  }
});

export default router;
