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
    <div className="">
      {/* Header */}
      <header className="">
        <button
          title='Back'  
          onClick={() => navigate(-1)}
          className=""
        >
          <ArrowLeft className="" />
        </button>
        <h1 className="">Privacy Policy</h1>
      </header>

      <div className="">
        {/* Introduction */}
        <div className="">
          <div className="">
            <Shield className="" />
            <h2 className="">Privacy Policy</h2>
          </div>
          <p className="">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="">
            At BusTrack, we are committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, and safeguard your
            personal information when you use our bus tracking application.
          </p>
        </div>

        {/* Sections */}
        <div className="">
          {sections.map((section, index) => (
            <div
              key={index}
              className=""
            >
              <div className="">
                <div className="">
                  <section.icon className="" />
                </div>
                <h3 className="">
                  {section.title}
                </h3>
              </div>
              <p className="">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="">
          <h3 className="">
            Questions About Privacy?
          </h3>
          <p className="">
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <a
            href='mailto:privacy@bustrack.com'
            className=""
          >
            privacy@bustrack.com
          </a>
        </div>
      </div>
    </div>
  )
}

