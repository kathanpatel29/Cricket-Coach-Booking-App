const Terms = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using CricCoach's services, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  2.1. You must be at least 13 years old to use our services.
                </p>
                <p>
                  2.2. You are responsible for maintaining the confidentiality of your account credentials.
                </p>
                <p>
                  2.3. You agree to provide accurate and complete information when creating an account.
                </p>
              </div>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Booking and Cancellation</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  3.1. All bookings are subject to coach availability.
                </p>
                <p>
                  3.2. Cancellations must be made at least 24 hours before the scheduled session.
                </p>
                <p>
                  3.3. Late cancellations may incur a fee of up to 50% of the session cost.
                </p>
              </div>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  4.1. All payments must be made through our secure payment system.
                </p>
                <p>
                  4.2. Prices are subject to change without notice.
                </p>
                <p>
                  4.3. Refunds will be processed according to our refund policy.
                </p>
              </div>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Code of Conduct</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  5.1. Users must behave professionally and respectfully.
                </p>
                <p>
                  5.2. Harassment or abuse will not be tolerated.
                </p>
                <p>
                  5.3. Violation of these terms may result in account termination.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };
  
  export default Terms;