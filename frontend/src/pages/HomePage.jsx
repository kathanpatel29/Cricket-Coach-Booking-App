import { useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import TestimonialsSection from "../components/TestimonialsSection"

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchTerm)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">Elevate Your Cricket Game</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Connect with expert coaches and transform your skills. Book your personalized cricket coaching session today!
        </p>
        <form onSubmit={handleSearch} className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Search by specialization or coach name"
            className="p-2 border border-gray-300 rounded-l-md w-64 md:w-96"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="bg-secondary text-white p-2 rounded-r-md hover:bg-orange-600 flex items-center"
          >
            <Search size={20} className="mr-2" />
            Search
          </button>
        </form>
        <Link
          to="/coaches"
          className="bg-primary text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition duration-300"
        >
          Find Your Coach Now
        </Link>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 font-poppins text-center">Why Choose CricCoach?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">Expert Coaches</h3>
            <p>Learn from experienced and certified cricket coaches tailored to your needs.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">Flexible Scheduling</h3>
            <p>Book sessions that fit your schedule with our easy-to-use platform.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-xl font-semibold mb-4">Personalized Training</h3>
            <p>Get tailored coaching to improve your specific skills and achieve your goals.</p>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="text-center mb-16">
        <h2 className="text-3xl font-semibold mb-4 font-poppins">Ready to Improve Your Game?</h2>
        <p className="text-xl mb-8">
          Join thousands of satisfied cricketers who have elevated their skills with CricCoach.
        </p>
        <Link
          to="/register"
          className="bg-secondary text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition duration-300"
        >
          Sign Up Now
        </Link>
      </section>
    </div>
  )
}

export default HomePage

