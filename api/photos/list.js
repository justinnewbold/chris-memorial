import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Get only approved photos, ordered by upload date (newest first)
    const photos = await sql`
      SELECT id, blob_url, uploader_name, caption, uploaded_at
      FROM uploaded_photos
      WHERE approved = true
      ORDER BY uploaded_at DESC
      LIMIT 100
    `;

    return res.status(200).json({
      success: true,
      photos: photos,
      count: photos.length
    });

  } catch (error) {
    console.error('Error fetching photos:', error);
    return res.status(500).json({
      error: 'Failed to fetch photos',
      details: error.message
    });
  }
}
