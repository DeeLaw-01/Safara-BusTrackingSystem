import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  FileText,
  ChevronRight
} from 'lucide-react'

export default function HelpSupport () {
  const navigate = useNavigate()

  const faqs = [
    {
      question: 'How do I track a bus?',
      answer:
        'Select a bus from the main dashboard, then tap "View Stops" to see the route and track the bus in real-time.'
    },
    {
      question: 'How accurate is the bus location?',
      answer:
        'Bus locations are updated in real-time using GPS. The location is typically accurate within 10-20 meters.'
    },
    {
      question: 'Can I set reminders for bus arrivals?',
      answer:
        'Yes! You can set reminders to get notified when your bus is approaching your stop.'
    },
    {
      question: 'What if I miss my bus?',
      answer:
        'You can track the next bus on the same route. Check the dashboard for other available buses.'
    },
    {
      question: 'How do I change my profile information?',
      answer:
        'Go to Settings from the menu, then edit your name, phone number, or profile picture.'
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
        <h1 className='text-lg font-bold text-gray-900'>Help & Support</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Contact Options */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Get in Touch
          </h2>

          <div className='space-y-3'>
            <a
              href='mailto:support@bustrack.com'
              className='flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'
            >
              <div className='p-2 bg-coral-100 rounded-lg'>
                <Mail className='w-5 h-5 text-coral-600' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-medium text-gray-900'>
                  Email Support
                </p>
                <p className='text-xs text-gray-500'>support@bustrack.com</p>
              </div>
              <ChevronRight className='w-5 h-5 text-gray-400' />
            </a>

            <button className='w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
              <div className='p-2 bg-primary-100 rounded-lg'>
                <MessageCircle className='w-5 h-5 text-primary-600' />
              </div>
              <div className='flex-1 text-left'>
                <p className='text-sm font-medium text-gray-900'>Live Chat</p>
                <p className='text-xs text-gray-500'>Available 24/7</p>
              </div>
              <ChevronRight className='w-5 h-5 text-gray-400' />
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6 mb-6'>
          <div className='flex items-center gap-3 mb-4'>
            <HelpCircle className='w-5 h-5 text-coral-500' />
            <h2 className='text-lg font-semibold text-gray-900'>
              Frequently Asked Questions
            </h2>
          </div>

          <div className='space-y-4'>
            {faqs.map((faq, index) => (
              <details
                key={index}
                className='group border-b border-gray-100 last:border-0 pb-4 last:pb-0'
              >
                <summary className='cursor-pointer list-none'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium text-gray-900 group-open:text-coral-600 transition-colors'>
                      {faq.question}
                    </p>
                    <ChevronRight className='w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform' />
                  </div>
                </summary>
                <p className='text-sm text-gray-600 mt-2 pl-4'>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className='bg-white rounded-2xl border border-gray-100 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Quick Links
          </h2>

          <div className='space-y-2'>
            <button
              onClick={() => navigate('/privacy')}
              className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left'
            >
              <FileText className='w-5 h-5 text-gray-400' />
              <span className='text-sm font-medium text-gray-900'>
                Privacy Policy
              </span>
              <ChevronRight className='w-4 h-4 text-gray-400 ml-auto' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
