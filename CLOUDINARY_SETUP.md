# Cloudinary Setup for Profile Pictures

## Required Environment Variables

Add these to your `client/.env` file:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=ClientSideUpload
```

**Note:** `VITE_CLOUDINARY_API_KEY` and `VITE_CLOUDINARY_API_SECRET` are optional for unsigned uploads. They're not used in the current implementation but can be set if you plan to use signed uploads in the future.

## Cloudinary Dashboard Setup

1. **Create an Unsigned Upload Preset:**
   - Go to [Cloudinary Dashboard](https://cloudinary.com/console)
   - Navigate to **Settings** → **Upload**
   - Click **Add upload preset**
   - Set the following:
     - **Preset name:** `ClientSideUpload`
     - **Signing mode:** `Unsigned` (important for client-side uploads)
     - **Folder:** `avatars` (optional, for organization)
   - **Upload manipulation** (Incoming Transformation):
     - Click "Add incoming transformation"
     - Add: `w_400,h_400,c_fill,g_face,q_auto,f_auto`
     - This creates 400x400px images with face detection, auto quality, and auto format
     - **Important:** Set this in the preset settings, not as a parameter in code

2. **Get Your Cloud Name:**
   - Your cloud name is shown in the Cloudinary dashboard URL: `https://console.cloudinary.com/console/c/YOUR_CLOUD_NAME`
   - Or find it in **Settings** → **Product environment credentials**

## How It Works

- Images are uploaded directly from the client to Cloudinary (no server involved)
- Cloudinary returns a secure URL (`https://res.cloudinary.com/...`)
- The URL is saved to the database
- Images are automatically optimized and transformed by Cloudinary

## Security Notes

- Using unsigned upload presets is safe for client-side uploads
- The upload preset can be restricted to specific folders and transformations
- Consider setting upload limits in the preset (max file size, allowed formats)
