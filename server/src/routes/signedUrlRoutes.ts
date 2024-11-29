import { Router, Request, Response } from 'express';
import { bucket } from '../app';

const router = Router();

router.get('/generate-signed-url', async (req: Request, res: Response) => {
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
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({ url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL.' });
  }
});

export default router;
