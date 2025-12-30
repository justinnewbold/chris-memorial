export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Verify current password
    const actualPassword = process.env.ADMIN_KEY;
    if (currentPassword !== actualPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Update password in Vercel
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const TEAM_ID = process.env.VERCEL_TEAM_ID;

    if (!VERCEL_TOKEN || !PROJECT_ID || !TEAM_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get current environment variables to find ADMIN_KEY id
    const listResponse = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
      }
    );

    if (!listResponse.ok) {
      throw new Error('Failed to fetch environment variables');
    }

    const envVars = await listResponse.json();
    const adminKeyEnv = envVars.envs?.find(env => env.key === 'ADMIN_KEY');

    if (!adminKeyEnv) {
      throw new Error('ADMIN_KEY not found');
    }

    // Delete old ADMIN_KEY
    const deleteResponse = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${adminKeyEnv.id}?teamId=${TEAM_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
      }
    );

    if (!deleteResponse.ok) {
      throw new Error('Failed to delete old password');
    }

    // Create new ADMIN_KEY
    const createResponse = await fetch(
      `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'ADMIN_KEY',
          value: newPassword,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        })
      }
    );

    if (!createResponse.ok) {
      throw new Error('Failed to create new password');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully. Please log in again with your new password.' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ 
      error: 'Failed to update password. Please try again.' 
    });
  }
}
