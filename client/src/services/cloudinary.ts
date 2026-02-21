/**
 * Cloudinary upload service for client-side image uploads
 * 
 * IMPORTANT: You need to create an unsigned upload preset in your Cloudinary dashboard:
 * 1. Go to Cloudinary Dashboard > Settings > Upload
 * 2. Create a new unsigned upload preset named "ClientSideUpload"
 * 3. Set the folder to "avatars" (optional)
 * 4. Set signing mode to "Unsigned"
 * 
 * Note: For unsigned uploads, VITE_CLOUDINARY_API_KEY and VITE_CLOUDINARY_API_SECRET
 * are not required, but can be set if you plan to use signed uploads in the future.
 */

interface CloudinaryUploadResponse {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  resource_type: string
}

interface UploadOptions {
  onProgress?: (progress: number) => void
}

/**
 * Upload an image file to Cloudinary
 * @param file - The image file to upload
 * @param options - Upload options including progress callback
 * @returns Promise with the Cloudinary secure URL
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ClientSideUpload'

  if (!cloudName) {
    throw new Error(
      'Cloudinary cloud name not configured. Please set VITE_CLOUDINARY_CLOUD_NAME in your .env file.'
    )
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 10MB')
  }

  // Create form data for unsigned upload
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'avatars')
  // Note: Transformations should be configured in the upload preset settings
  // in Cloudinary dashboard, not passed as parameters for unsigned uploads

  try {
    const xhr = new XMLHttpRequest()

    // Set up progress tracking
    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          options.onProgress!(progress)
        }
      })
    }

    // Create promise for upload
    const uploadPromise = new Promise<CloudinaryUploadResponse>((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.error) {
              reject(new Error(response.error.message || 'Upload failed'))
            } else {
              resolve(response)
            }
          } catch (error) {
            reject(new Error('Failed to parse Cloudinary response'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error?.message || `Upload failed with status ${xhr.status}`))
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'))
      })
    })

    // Start upload
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.send(formData)

    const response = await uploadPromise
    return response.secure_url
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to upload image to Cloudinary')
  }
}
