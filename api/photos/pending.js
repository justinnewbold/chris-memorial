import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminKey } = req.query;

    // Verify admin key
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Get pending (not approved) photos
    const photos = await sql`
      SELECT id, blob_url, uploader_name, caption, uploaded_at, file_size, mime_type
      FROM uploaded_photos
      WHERE approved = false
      ORDER BY uploaded_at DESC
    `;

    return res.status(200).json({
      success: true,
      photos: photos,
      count: photos.length
    });

  } catch (error) {
    console.error('Error fetching pending photos:', error);
    return res.status(500).json({
      error: 'Failed to fetch pending photos',
      details: error.message
    });
  }
}
