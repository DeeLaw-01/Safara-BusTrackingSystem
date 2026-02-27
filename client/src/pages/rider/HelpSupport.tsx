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
        <h1 className="">Help & Support</h1>
      </header>

      <div className="">
        {/* Contact Options */}
        <div className="">
          <h2 className="">
            Get in Touch
          </h2>

          <div className="">
            <a
              href='mailto:support@bustrack.com'
              className=""
            >
              <div className="">
                <Mail className="" />
              </div>
              <div className="">
                <p className="">
                  Email Support
                </p>
                <p className="">support@bustrack.com</p>
              </div>
              <ChevronRight className="" />
            </a>

            <button className="">
              <div className="">
                <MessageCircle className="" />
              </div>
              <div className="">
                <p className="">Live Chat</p>
                <p className="">Available 24/7</p>
              </div>
              <ChevronRight className="" />
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="">
          <div className="">
            <HelpCircle className="" />
            <h2 className="">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className=""
              >
                <summary className="">
                  <div className="">
                    <p className="">
                      {faq.question}
                    </p>
                    <ChevronRight className="" />
                  </div>
                </summary>
                <p className="">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="">
          <h2 className="">
            Quick Links
          </h2>

          <div className="">
            <button
              onClick={() => navigate('/privacy')}
              className=""
            >
              <FileText className="" />
              <span className="">
                Privacy Policy
              </span>
              <ChevronRight className="" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

