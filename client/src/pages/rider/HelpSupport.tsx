import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  HelpCircle,
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
        <h1 className='text-lg font-semibold font-bold text-slate-800'>Help & Support</h1>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-6 space-y-5'>
        {/* Contact Options */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <h2 className='text-base font-semibold text-slate-800 mb-4'>
            Get in Touch
          </h2>

          <div className='space-y-3'>
            <a
              href='mailto:support@safara.com'
              className='flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors'
            >
              <div className='info-stat-icon bg-teal-50'>
                <Mail className='w-5 h-5 text-teal-600' />
              </div>
              <div className='flex-1'>
                <p className='text-sm font-medium text-slate-800'>
                  Email Support
                </p>
                <p className='text-xs text-slate-500'>support@safara.com</p>
              </div>
              <ChevronRight className='w-5 h-5 text-slate-400' />
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <div className='flex items-center gap-3 mb-4'>
            <HelpCircle className='w-5 h-5 text-teal-600' />
            <h2 className='text-base font-semibold text-slate-800'>
              Frequently Asked Questions
            </h2>
          </div>

          <div className='space-y-4'>
            {faqs.map((faq, index) => (
              <details
                key={index}
                className='group border-b border-slate-200 last:border-0 pb-4 last:pb-0'
              >
                <summary className='cursor-pointer list-none'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium text-slate-800 group-open:text-teal-600 transition-colors'>
                      {faq.question}
                    </p>
                    <ChevronRight className='w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform' />
                  </div>
                </summary>
                <p className='text-sm text-slate-500 mt-2 pl-4'>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-5'>
          <h2 className='text-base font-semibold text-slate-800 mb-4'>
            Quick Links
          </h2>

          <div className='space-y-2'>
            <button
              onClick={() => navigate('/privacy')}
              className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors text-left'
            >
              <FileText className='w-5 h-5 text-slate-400' />
              <span className='text-sm font-medium text-slate-800'>
                Privacy Policy
              </span>
              <ChevronRight className='w-4 h-4 text-slate-400 ml-auto' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
