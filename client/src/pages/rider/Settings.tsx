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
  X,
  Shield,
  Edit3
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
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')

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
      updateUser(data.data)
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
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const url = await uploadToCloudinary(file, { onProgress: setUploadProgress })
      handleAvatarUrlChange(url)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className='min-h-screen bg-stone-50'>
      {/* Sticky Header */}
      <header className='sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-stone-200/80'>
        <div className='max-w-2xl mx-auto px-4 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => navigate(-1)}
              className='p-2 -ml-2 hover:bg-stone-100 rounded-xl transition-colors'
              aria-label='Go back'
            >
              <ArrowLeft className='w-5 h-5 text-stone-600' />
            </button>
            <h1 className='text-lg font-bold text-stone-800'>Edit Profile</h1>
          </div>
          <button
            type='submit'
            form='settings-form'
            disabled={loading}
            className='text-sm font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50 flex items-center gap-1.5'
          >
            {loading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : success ? (
              <><Check className='w-4 h-4 text-orange-500' /> Saved</>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </header>

      <form id='settings-form' onSubmit={handleSubmit}>
        <div className='max-w-2xl mx-auto px-4 py-6 space-y-6'>

          {/* ═══ Profile Card — centered avatar with name ═══ */}
          <div className='bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden'>
            {/* Teal accent top */}
            <div className='h-20 bg-gradient-to-r from-amber-500 to-orange-500 relative'>
              <div className='absolute inset-0 opacity-10'
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />
            </div>

            <div className='px-5 pb-5 -mt-10 relative'>
              {/* Avatar */}
              <div className='relative w-20 h-20 mx-auto'>
                <UserAvatar
                  name={formData.name}
                  avatar={formData.avatar}
                  size='xl'
                  className='ring-4 ring-white shadow-lg w-20 h-20'
                />
                <label className={`absolute bottom-0 right-0 w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-500 transition-colors shadow-md ${uploading ? 'animate-pulse' : ''}`}>
                  {uploading ? (
                    <Loader2 className='w-3.5 h-3.5 text-white animate-spin' />
                  ) : (
                    <Camera className='w-3.5 h-3.5 text-white' />
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    disabled={uploading}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </label>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className='mt-3 max-w-[200px] mx-auto'>
                  <div className='w-full bg-stone-100 rounded-full h-1.5 overflow-hidden'>
                    <div
                      className='bg-amber-500 h-1.5 rounded-full transition-all duration-300'
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className='text-[10px] text-stone-400 text-center mt-1'>{Math.round(uploadProgress)}%</p>
                </div>
              )}

              {/* URL Input */}
              <div className='mt-3 text-center'>
                {!showUrlInput ? (
                  <div className='flex items-center justify-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setShowUrlInput(true)}
                      className='text-xs text-amber-600 hover:text-amber-700 font-medium'
                    >
                      Use URL instead
                    </button>
                    {formData.avatar && (
                      <>
                        <span className='text-stone-200'>·</span>
                        <button
                          type='button'
                          onClick={() => handleAvatarUrlChange('')}
                          className='text-xs text-red-500 hover:text-red-600 font-medium'
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className='flex gap-2 mt-2'>
                    <input
                      type='url'
                      value={urlInputValue}
                      onChange={e => setUrlInputValue(e.target.value)}
                      placeholder='https://example.com/image.jpg'
                      className='input-auth flex-1 text-sm'
                      autoFocus
                    />
                    <button
                      type='button'
                      onClick={() => {
                        if (urlInputValue.trim()) {
                          handleAvatarUrlChange(urlInputValue.trim())
                          setUrlInputValue('')
                          setShowUrlInput(false)
                        }
                      }}
                      disabled={!urlInputValue.trim()}
                      className='bg-amber-600 text-white px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50'
                    >
                      Apply
                    </button>
                    <button
                      type='button'
                      onClick={() => { setShowUrlInput(false); setUrlInputValue('') }}
                      className='p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Personal Information ═══ */}
          <div className='bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden'>
            <div className='px-5 py-3.5 border-b border-stone-100 flex items-center gap-2'>
              <Edit3 className='w-4 h-4 text-stone-400' />
              <h2 className='text-sm font-semibold text-stone-700'>Personal Information</h2>
            </div>

            <div className='divide-y divide-stone-100'>
              {/* Name */}
              <div className='px-5 py-4'>
                <label className='block text-xs text-stone-400 mb-1.5'>Full Name</label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300' />
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className='w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all'
                    placeholder='Enter your full name'
                    required
                  />
                </div>
              </div>

              {/* Email — locked */}
              <div className='px-5 py-4'>
                <label className='block text-xs text-stone-400 mb-1.5 flex items-center gap-1'>
                  Email Address
                  <Shield className='w-3 h-3 text-stone-300' />
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300' />
                  <input
                    type='email'
                    value={formData.email}
                    disabled
                    className='w-full pl-10 pr-3 py-2.5 border border-stone-100 rounded-xl text-sm text-stone-400 bg-stone-50 cursor-not-allowed'
                  />
                </div>
              </div>

              {/* Phone */}
              <div className='px-5 py-4'>
                <label className='block text-xs text-stone-400 mb-1.5'>Phone Number</label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300' />
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className='w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all'
                    placeholder='Your phone number'
                  />
                </div>
                <p className='text-[11px] text-stone-400 mt-1.5'>Drivers can call you if needed</p>
              </div>
            </div>
          </div>

          {/* ═══ Feedback Messages ═══ */}
          {success && (
            <div className='flex items-center gap-2 p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-700'>
              <Check className='w-4 h-4' />
              <span className='text-sm font-medium'>Profile updated successfully!</span>
            </div>
          )}
          {error && (
            <div className='flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600'>
              <X className='w-4 h-4' />
              <span className='text-sm font-medium'>{error}</span>
            </div>
          )}

          {/* ═══ Actions ═══ */}
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='flex-1 py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm'
            >
              {loading ? (
                <><Loader2 className='w-4 h-4 animate-spin' /> Saving...</>
              ) : (
                <><Save className='w-4 h-4' /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
