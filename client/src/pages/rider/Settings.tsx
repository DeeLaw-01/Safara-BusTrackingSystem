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
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-50'>
        <button
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors'
          aria-label='Go back'
        >
          <ArrowLeft className='w-5 h-5 text-gray-700' />
        </button>
        <h1 className='text-lg font-bold text-gray-900'>Settings</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Profile Picture Section */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Profile Picture
          </h2>

          <div className='flex items-center gap-6 mb-6'>
            <UserAvatar
              name={formData.name}
              avatar={formData.avatar}
              size='xl'
              className='ring-4 ring-coral-100'
            />
            <div className='flex-1'>
              <p className='text-sm text-gray-600 mb-2'>
                Upload a new profile picture or enter an image URL
              </p>
              <div className='flex gap-2 flex-wrap'>
                <label
                  className={`btn btn-secondary cursor-pointer text-sm ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label='Upload profile picture'
                >
                  {uploading ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className='w-4 h-4' />
                      Upload
                    </>
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
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
                  className='btn btn-secondary text-sm disabled:opacity-50'
                >
                  From URL
                </button>
                {formData.avatar && (
                  <button
                    onClick={() => handleAvatarUrlChange('')}
                    disabled={uploading}
                    className='btn btn-secondary text-sm text-red-500 hover:text-red-600 disabled:opacity-50'
                  >
                    <X className='w-4 h-4' />
                    Remove
                  </button>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className='mt-3'>
                  <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                    <div
                      className='bg-coral-500 h-2 rounded-full transition-all duration-300'
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
            <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
              <p className='text-xs text-gray-500 mb-1'>
                Image hosted on Cloudinary
              </p>
              <p className='text-xs text-gray-700 font-mono break-all'>
                {formData.avatar.length > 60
                  ? `${formData.avatar.substring(0, 60)}...`
                  : formData.avatar}
              </p>
            </div>
          )}
        </div>

        {/* Account Information Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='bg-white rounded-2xl border border-gray-100 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Account Information
            </h2>

            <div className='space-y-4'>
              {/* Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    className='input-auth pl-10'
                    placeholder='Enter your full name'
                    required
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='email'
                    value={formData.email}
                    disabled
                    aria-label='Email address (read-only)'
                    className='input-auth pl-10 bg-gray-50 text-gray-500 cursor-not-allowed'
                  />
                </div>
                <p className='text-xs text-gray-500 mt-1'>
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Phone Number
                </label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    className='input-auth pl-10'
                    placeholder='Enter your phone number'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className='flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700'>
              <Check className='w-5 h-5' />
              <span className='text-sm font-medium'>
                Profile updated successfully!
              </span>
            </div>
          )}

          {error && (
            <div className='flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700'>
              <X className='w-5 h-5' />
              <span className='text-sm font-medium'>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='btn btn-secondary flex-1'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='btn btn-coral flex-1'
            >
              {loading ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-5 h-5' />
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
