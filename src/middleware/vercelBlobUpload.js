const { put } = require('@vercel/blob');

const vercelBlobUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Upload file to Vercel Blob storage
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true // Add random suffix to avoid filename conflicts
    });

    // Store the blob URL in the request for later use
    req.blobUrl = blob.url;
    
    next();
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image to cloud storage' });
  }
};

module.exports = vercelBlobUpload;