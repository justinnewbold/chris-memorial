# Photo Upload Feature Setup Guide

## Features Added

✨ **Visitor Photo Uploads**: Anyone can upload photos to the memorial
📦 **Vercel Blob Storage**: Photos stored securely in the cloud
🗄️ **Neon Postgres**: Photo metadata stored in database
✅ **Moderation System**: Review photos before they appear publicly
🖼️ **Photo Gallery**: Beautiful display of community photos

## Setup Instructions

### Step 1: Enable Vercel Blob Storage

1. Go to Vercel Dashboard: https://vercel.com/newbold-cloud/chris-memorial
2. Click on **Storage** tab
3. Click **Create Database**
4. Select **Blob** storage
5. Click **Create**
6. Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables

### Step 2: Set Up Neon Postgres

You mentioned you already have Neon Postgres set up. If not:

1. Go to https://neon.tech
2. Create a new project
3. Copy your connection string (looks like `postgresql://user:password@host.neon.tech/dbname`)

### Step 3: Add Environment Variables to Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
DATABASE_URL = your-neon-postgres-connection-string
ADMIN_KEY = generate-a-secure-random-string
```

**How to generate a secure ADMIN_KEY:**
- Option 1: Use https://www.uuidgenerator.net/
- Option 2: Run in terminal: `openssl rand -base64 32`

### Step 4: Initialize Database

After deployment, run this ONCE to create the database tables:

```bash
curl -X POST https://chris.newbold.cloud/api/photos/init-db
```

You should see: `{"success":true,"message":"Database initialized successfully"}`

### Step 5: Test Photo Upload

1. Visit https://chris.newbold.cloud
2. Scroll to "Share Your Photos" section
3. Upload a test photo
4. Check if it uploads successfully

## Photo Moderation

### View Pending Photos

To see photos waiting for approval:

```bash
curl "https://chris.newbold.cloud/api/photos/pending?adminKey=YOUR_ADMIN_KEY"
```

### Approve a Photo

```bash
curl -X POST https://chris.newbold.cloud/api/photos/admin \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "YOUR_ADMIN_KEY",
    "photoId": 1,
    "action": "approve"
  }'
```

### Reject a Photo

```bash
curl -X POST https://chris.newbold.cloud/api/photos/admin \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "YOUR_ADMIN_KEY",
    "photoId": 1,
    "action": "reject"
  }'
```

## How It Works

1. **Visitor uploads photo** → Form on website
2. **Photo is validated** → Size, type, and content checks
3. **Photo stored in Vercel Blob** → Permanent cloud storage
4. **Metadata saved to Neon Postgres** → Name, caption, timestamp
5. **Set as "pending"** → Waits for admin approval
6. **Admin reviews** → Approve or reject via API
7. **Approved photos appear** → Automatically shown in gallery

## File Structure

```
/api/photos/
  ├── init-db.js      - Initialize database tables
  ├── upload.js       - Handle photo uploads
  ├── list.js         - Get approved photos
  ├── pending.js      - Get pending photos (admin)
  └── admin.js        - Approve/reject photos (admin)

/index.html           - Updated with upload form & gallery
/package.json         - Dependencies for Neon & Blob
/.env.example         - Environment variables template
```

## Troubleshooting

### "Database not configured" error
- Check that `DATABASE_URL` is set in Vercel environment variables
- Redeploy the site after adding environment variables

### "Failed to upload photo" error
- Check that Vercel Blob storage is enabled
- Check that `BLOB_READ_WRITE_TOKEN` exists in environment variables

### Photos not appearing
- Photos need admin approval first
- Use the pending API to check if photos are waiting for approval

### Admin API returns 401
- Check that your `ADMIN_KEY` is correct
- Make sure it matches the one in Vercel environment variables

## Security Notes

- ✅ Photos are validated for type and size
- ✅ All uploads require moderation before appearing publicly  
- ✅ Admin API requires secret key
- ✅ SQL injection protection via parameterized queries
- ✅ XSS protection via HTML escaping

## Support

If you need help, check:
- Vercel Logs: https://vercel.com/newbold-cloud/chris-memorial/logs
- Neon Dashboard: https://neon.tech
