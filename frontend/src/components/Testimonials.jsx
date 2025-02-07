const Testimonials = () => {
    const testimonials = [
      { name: "Amit Sharma", feedback: "Best coaching experience!" },
      { name: "Priya Patel", feedback: "Helped improve my batting skills." },
      { name: "Rahul Mehta", feedback: "Highly recommend CricCoach!" },
    ];
  
    return (
      <div className="mt-10 text-center">
        <h2 className="text-2xl font-bold">What Our Clients Say</h2>
        <div className="flex justify-center mt-6 space-x-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded shadow-md">
              <p className="font-bold">{testimonial.name}</p>
              <p>{testimonial.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default Testimonials;
  