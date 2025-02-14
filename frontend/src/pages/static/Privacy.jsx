const Privacy = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-600">
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside pl-4">
                  <li>Name and contact information</li>
                  <li>Account credentials</li>
                  <li>Payment information</li>
                  <li>Profile information</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-600">
                <p>We use the collected information to:</p>
                <ul className="list-disc list-inside pl-4">
                  <li>Provide and improve our services</li>
                  <li>Process payments</li>
                  <li>Send notifications and updates</li>
                  <li>Respond to your requests</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
              </div>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
              <p className="text-gray-600">
                We do not sell or rent your personal information to third parties. 
                We may share your information with service providers who assist in our operations.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="text-gray-600">
                We implement appropriate security measures to protect your personal information. 
                However, no method of transmission over the internet is 100% secure.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <div className="space-y-4 text-gray-600">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside pl-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };
  
  export default Privacy;