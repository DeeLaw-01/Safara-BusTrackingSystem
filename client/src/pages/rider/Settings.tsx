import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { userApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { uploadToCloudinary } from '@/services/cloudinary'
import UserAvatar from '@/components/ui/UserAvatar'

export default function Settings () {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  })

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data } = await userApi.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        avatar: formData.avatar || undefined
      })

      // Update the user in the store
      if (data.data) {
        updateUser({
          name: data.data.name,
          phone: data.data.phone,
          avatar: formData.avatar || data.data.avatar
        })
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }))
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const cloudinaryUrl = await uploadToCloudinary(file, {
        onProgress: progress => {
          setUploadProgress(progress)
        }
      })

      handleAvatarUrlChange(cloudinaryUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="">
      {/* Header */}
      <header className="">
        <button
          onClick={() => navigate(-1)}
          className=""
          aria-label='Go back'
        >
          <ArrowLeft className="" />
        </button>
        <h1 className="">Settings</h1>
      </header>

      <div className="">
        {/* Profile Picture Section */}
        <div className="">
          <h2 className="">
            Profile Picture
          </h2>

          <div className="">
            <UserAvatar
              name={formData.name}
              avatar={formData.avatar}
              size='xl'
              className=""
            />
            <div className="">
              <p className="">
                Upload a new profile picture or enter an image URL
              </p>
              <div className="">
                <label
                  className={`btn btn-secondary cursor-pointer text-sm ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label='Upload profile picture'
                >
                  {uploading ? (
                    <>
                      <Loader2 className="" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="" />
                      Upload
                    </>
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    className=""
                    disabled={uploading}
                    aria-label='Select profile picture file'
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file)
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    const url = prompt('Enter image URL:')
                    if (url) handleAvatarUrlChange(url)
                  }}
                  disabled={uploading}
                  className=""
                >
                  From URL
                </button>
                {formData.avatar && (
                  <button
                    onClick={() => handleAvatarUrlChange('')}
                    disabled={uploading}
                    className=""
                  >
                    <X className="" />
                    Remove
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="">
                  <div className="">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="">
                    <div
                      className=""
                      style={{ width: `${uploadProgress}%` }}
                      role='progressbar'
                      aria-label={`Upload progress: ${Math.round(
                        uploadProgress
                      )}%`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {formData.avatar && !formData.avatar.startsWith('data:') && (
            <div className="">
              <p className="">
                Image hosted on Cloudinary
              </p>
              <p className="">
                {formData.avatar.length > 60
                  ? `${formData.avatar.substring(0, 60)}...`
                  : formData.avatar}
              </p>
            </div>
          )}
        </div>

        {/* Account Information Form */}
        <form onSubmit={handleSubmit} className="">
          <div className="">
            <h2 className="">
              Account Information
            </h2>

            <div className="">
              {/* Name */}
              <div>
                <label className="">
                  Full Name
                </label>
                <div className="">
                  <User className="" />
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    className=""
                    placeholder='Enter your full name'
                    required
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="">
                  Email Address
                </label>
                <div className="">
                  <Mail className="" />
                  <input
                    type='email'
                    value={formData.email}
                    disabled
                    aria-label='Email address (read-only)'
                    className=""
                  />
                </div>
                <p className="">
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="">
                  Phone Number
                </label>
                <div className="">
                  <Phone className="" />
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    className=""
                    placeholder='Enter your phone number'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="">
              <Check className="" />
              <span className="">
                Profile updated successfully!
              </span>
            </div>
          )}

          {error && (
            <div className="">
              <X className="" />
              <span className="">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="">
            <button
              type='button'
              onClick={() => navigate(-1)}
              className=""
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className=""
            >
              {loading ? (
                <>
                  <Loader2 className="" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

