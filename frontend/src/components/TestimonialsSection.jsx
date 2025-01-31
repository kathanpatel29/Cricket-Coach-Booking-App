import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "John Smith",
    role: "Amateur Cricketer",
    content:
      "CricCoach has been a game-changer for me. The personalized coaching helped me improve my batting technique significantly.",
    rating: 5,
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "School Team Captain",
    content:
      "I love how easy it is to book sessions with top-notch coaches. My team's performance has improved dramatically!",
    rating: 5,
  },
  {
    id: 3,
    name: "Mike Brown",
    role: "Cricket Enthusiast",
    content: "The flexibility of scheduling and the quality of coaches on CricCoach is unmatched. Highly recommended!",
    rating: 4,
  },
]

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-semibold mb-8 font-poppins text-center">What Our Users Say</h2>
      <div className="relative bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <button
          onClick={prevTestimonial}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition duration-300"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-lg mb-4">"{testimonials[currentIndex].content}"</p>
          <div className="font-semibold">{testimonials[currentIndex].name}</div>
          <div className="text-gray-600">{testimonials[currentIndex].role}</div>
          <div className="text-yellow-500 mt-2">
            {"★".repeat(testimonials[currentIndex].rating)}
            {"☆".repeat(5 - testimonials[currentIndex].rating)}
          </div>
        </div>
        <button
          onClick={nextTestimonial}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition duration-300"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  )
}

export default TestimonialsSection

