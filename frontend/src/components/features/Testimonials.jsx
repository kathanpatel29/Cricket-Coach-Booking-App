const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Rahul Sharma",
      role: "Club Cricketer",
      image: "/testimonials/rahul.jpg", // Add actual image path
      quote: "The coaching sessions have transformed my batting technique. My average has improved significantly since training with CricCoach.",
      rating: 5
    },
    {
      id: 2,
      name: "Priya Patel",
      role: "State Player",
      image: "/testimonials/priya.jpg", // Add actual image path
      quote: "The personalized attention and video analysis helped me identify and fix flaws in my bowling action. Highly recommended!",
      rating: 5
    },
    {
      id: 3,
      name: "Ahmed Khan",
      role: "Academy Player",
      image: "/testimonials/ahmed.jpg", // Add actual image path
      quote: "Great platform to connect with experienced coaches. The flexibility in scheduling makes it perfect for busy professionals.",
      rating: 4
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Players Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image || "https://via.placeholder.com/60"}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
              
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    className={`w-5 h-5 ${
                      index < testimonial.rating ? 'fill-current' : 'text-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;