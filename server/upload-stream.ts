// Streaming upload endpoint for large files
// Bypasses tRPC size limits by using direct HTTP multipart upload

import { Router } from 'express';
import multer from 'multer';
import { storagePut } from './storage';
import * as db from './db';
import { nanoid } from 'nanoid';

const router = Router();

// Configure multer to handle large files in memory with streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 * 1024, // 100GB limit
  },
});

router.post('/api/upload-stream', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get user from session (assuming auth middleware is applied)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { originalname: fileName, mimetype: mimeType, size: fileSize, buffer } = req.file;
    const folder = req.body.folder || '/';

    // Check user storage limit
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscriptionTier !== 'unlimited' && user.storageUsed + fileSize > user.storageLimit) {
      return res.status(403).json({ error: 'Storage limit exceeded' });
    }

    // Upload to S3
    const fileKey = `users/${userId}/files/${nanoid()}-${fileName}`;
    const { url } = await storagePut(fileKey, buffer, mimeType);

    // Save to database
    await db.createFile({
      userId,
      fileName,
      fileKey,
      fileUrl: url,
      fileSize,
      mimeType,
      folder,
    });

    // Update storage usage
    await db.updateUserStorage(userId, user.storageUsed + fileSize);

    res.json({ success: true, url, fileName, fileSize });
  } catch (error: any) {
    console.error('[Upload Stream] Error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

export default router;
