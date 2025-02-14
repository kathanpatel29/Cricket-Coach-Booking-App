const About = () => {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">About CricCoach</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
              <p className="text-gray-600">
                At CricCoach, we're dedicated to making professional cricket coaching 
                accessible to everyone. Our platform connects aspiring cricketers with 
                experienced coaches, helping them improve their game and achieve their 
                cricketing goals.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
              <p className="text-gray-600">
                Founded in 2023, CricCoach was born from a passion for cricket and a 
                desire to bridge the gap between talented coaches and eager learners. 
                We've since helped thousands of players improve their skills through 
                personalized coaching sessions.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Verified and experienced coaches</li>
                <li>Flexible scheduling options</li>
                <li>Personalized training programs</li>
                <li>State-of-the-art facilities</li>
                <li>Video analysis and feedback</li>
                <li>Affordable pricing plans</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  };
  
  export default About;