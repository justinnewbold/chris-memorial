import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminKey, photoId, action } = req.body;

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate inputs
    if (!photoId || !action) {
      return res.status(400).json({ error: 'Photo ID and action are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }

    const sql = neon(process.env.DATABASE_URL);

    if (action === 'approve') {
      // Approve the photo
      const result = await sql`
        UPDATE uploaded_photos
        SET approved = true
        WHERE id = ${photoId}
        RETURNING id, blob_url, uploader_name, caption, approved
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Photo approved',
        photo: result[0]
      });

    } else if (action === 'reject') {
      // Delete the photo
      const result = await sql`
        DELETE FROM uploaded_photos
        WHERE id = ${photoId}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Photo rejected and deleted'
      });
    }

  } catch (error) {
    console.error('Admin action error:', error);
    return res.status(500).json({
      error: 'Failed to process admin action',
      details: error.message
    });
  }
}
