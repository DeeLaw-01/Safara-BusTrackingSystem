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
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <header className='page-header'>
        <button
          title='Back'  
          onClick={() => navigate(-1)}
          className='p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-slate-800' />
        </button>
        <h1 className='text-lg font-semibold font-bold text-slate-800'>Privacy Policy</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6 space-y-5'>
        {/* Introduction */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <div className='flex items-center gap-3 mb-4'>
            <Shield className='w-6 h-6 text-teal-600' />
            <h2 className='text-xl font-semibold font-bold text-slate-800'>Privacy Policy</h2>
          </div>
          <p className='text-sm text-slate-500 leading-relaxed'>
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className='text-sm text-slate-500 leading-relaxed mt-4'>
            At Safara, we are committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, and safeguard your
            personal information when you use our bus tracking application.
          </p>
        </div>

        {/* Sections */}
        <div className='space-y-4'>
          {sections.map((section, index) => (
            <div
              key={index}
              className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'
            >
              <div className='flex items-center gap-3 mb-3'>
                <div className='info-stat-icon bg-teal-50'>
                  <section.icon className='w-5 h-5 text-teal-600' />
                </div>
                <h3 className='text-base font-semibold text-slate-800'>
                  {section.title}
                </h3>
              </div>
              <p className='text-sm text-slate-500 leading-relaxed'>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <h3 className='text-base font-semibold text-slate-800 mb-2'>
            Questions About Privacy?
          </h3>
          <p className='text-sm text-slate-500 mb-4'>
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <a
            href='mailto:privacy@safara.com'
            className='text-sm text-teal-600 hover:text-teal-700 font-medium'
          >
            privacy@safara.com
          </a>
        </div>
      </div>
    </div>
  )
}
