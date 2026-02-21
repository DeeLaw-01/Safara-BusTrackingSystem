import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react'

export default function PrivacyPolicy () {
  const navigate = useNavigate()

  const sections = [
    {
      icon: Shield,
      title: 'Data Collection',
      content:
        'We collect information necessary to provide our bus tracking services, including your name, email address, phone number, and location data when you use the app.'
    },
    {
      icon: Lock,
      title: 'Data Security',
      content:
        'Your personal information is encrypted and stored securely. We use industry-standard security measures to protect your data from unauthorized access.'
    },
    {
      icon: Eye,
      title: 'Location Data',
      content:
        'We only collect your location data when you actively use the app to track buses. This data is used solely to provide accurate bus tracking and is not shared with third parties.'
    },
    {
      icon: FileText,
      title: 'Your Rights',
      content:
        'You have the right to access, update, or delete your personal information at any time through your account settings. You can also opt out of location tracking in your device settings.'
    }
  ]

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 sticky top-0 z-50'>
        <button
          title='Back'  
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-gray-700' />
        </button>
        <h1 className='text-lg font-bold text-gray-900'>Privacy Policy</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Introduction */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Shield className='w-6 h-6 text-coral-500' />
            <h2 className='text-xl font-bold text-gray-900'>Privacy Policy</h2>
          </div>
          <p className='text-sm text-gray-600 leading-relaxed'>
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className='text-sm text-gray-600 leading-relaxed mt-4'>
            At BusTrack, we are committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, and safeguard your
            personal information when you use our bus tracking application.
          </p>
        </div>

        {/* Sections */}
        <div className='space-y-4'>
          {sections.map((section, index) => (
            <div
              key={index}
              className='bg-white rounded-2xl border border-gray-100 p-6'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-2 bg-coral-100 rounded-lg'>
                  <section.icon className='w-5 h-5 text-coral-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {section.title}
                </h3>
              </div>
              <p className='text-sm text-gray-600 leading-relaxed'>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mt-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            Questions About Privacy?
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <a
            href='mailto:privacy@bustrack.com'
            className='text-sm text-coral-600 hover:text-coral-700 font-medium'
          >
            privacy@bustrack.com
          </a>
        </div>
      </div>
    </div>
  )
}
