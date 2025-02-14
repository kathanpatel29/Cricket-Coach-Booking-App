const FAQ = () => {
    const faqs = [
      {
        question: "How do I book a coaching session?",
        answer: "You can book a session by registering on our platform, browsing available coaches, and selecting your preferred time slot. Payment can be made securely online."
      },
      {
        question: "What if I need to cancel my session?",
        answer: "Sessions can be cancelled up to 24 hours before the scheduled time for a full refund. Late cancellations may be subject to a cancellation fee."
      },
      {
        question: "Are the coaches certified?",
        answer: "Yes, all our coaches are verified professionals with relevant certifications and experience in cricket coaching."
      },
      {
        question: "What equipment do I need to bring?",
        answer: "Basic cricket gear including bat, pads, and helmet is required. Some coaches may provide equipment - check their profile for details."
      },
      {
        question: "How long is each session?",
        answer: "Standard sessions are 1 hour long, but you can book extended sessions of 2 or 3 hours based on availability."
      }
    ];
  
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300"
              >
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
  
          <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-4">
              We're here to help! Contact our support team for assistance.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  };
  
  export default FAQ;