import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, uploaderName, caption } = req.body;

    // Validate inputs
    if (!image || !uploaderName) {
      return res.status(400).json({ 
        error: 'Image and uploader name are required' 
      });
    }

    // Validate uploader name length
    if (uploaderName.length > 255) {
      return res.status(400).json({ 
        error: 'Uploader name is too long (max 255 characters)' 
      });
    }

    // Validate image is base64
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ 
        error: 'Invalid image format' 
      });
    }

    // Extract mime type and base64 data
    const matches = image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ 
        error: 'Invalid image data' 
      });
    }

    const mimeType = `image/${matches[1]}`;
    const base64Data = matches[2];
    
    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({ 
        error: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP' 
      });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    const fileSize = buffer.length;

    // Check file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'Image too large. Maximum size is 10MB' 
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = mimeType.split('/')[1];
    const filename = `memorial-photos/${timestamp}-${randomStr}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: mimeType,
    });

    // Save metadata to Neon Postgres
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      INSERT INTO uploaded_photos (blob_url, uploader_name, caption, file_size, mime_type, approved)
      VALUES (${blob.url}, ${uploaderName}, ${caption || null}, ${fileSize}, ${mimeType}, false)
      RETURNING id, blob_url, uploader_name, caption, uploaded_at, approved
    `;

    return res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully! It will appear after moderation.',
      photo: result[0]
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload photo',
      details: error.message
    });
  }
}
