import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Create uploaded_photos table
    await sql`
      CREATE TABLE IF NOT EXISTS uploaded_photos (
        id SERIAL PRIMARY KEY,
        blob_url TEXT NOT NULL,
        uploader_name VARCHAR(255) NOT NULL,
        caption TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved BOOLEAN DEFAULT false,
        file_size INTEGER,
        mime_type VARCHAR(100)
      )
    `;

    // Create index for approved photos
    await sql`
      CREATE INDEX IF NOT EXISTS idx_approved_photos 
      ON uploaded_photos(approved, uploaded_at DESC)
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      error: 'Failed to initialize database',
      details: error.message 
    });
  }
}
