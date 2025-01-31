import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import * as api from "../utils/api"
import { Search, Filter } from "lucide-react"

const CoachListingPage = () => {
  const [coaches, setCoaches] = useState([])
  const [filteredCoaches, setFilteredCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [specialization, setSpecialization] = useState("All")
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await api.getAllCoaches()
        const approvedCoaches = response.data.filter((coach) => coach.user.isApproved)
        setCoaches(approvedCoaches)
        setFilteredCoaches(approvedCoaches)
        setLoading(false)
      } catch (error) {
        setError("Failed to fetch coaches")
        setLoading(false)
      }
    }
    fetchCoaches()
  }, [])

  useEffect(() => {
    const filtered = coaches.filter(
      (coach) =>
        (specialization === "All" || coach.specialization === specialization) &&
        coach.averageRating >= minRating &&
        (coach.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coach.specialization.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredCoaches(filtered)
  }, [coaches, searchTerm, specialization, minRating])

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled by the useEffect above
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-poppins">Find Your Perfect Coach</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <div className="bg-white shadow-md rounded-lg p-4 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Filter size={20} className="mr-2" />
              Filters
            </h2>
            <form onSubmit={handleSearch}>
              <div className="mb-4">
                <label htmlFor="search" className="block mb-2 font-medium">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Coach name or specialization"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="specialization" className="block mb-2 font-medium">
                  Specialization
                </label>
                <select
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="All">All</option>
                  <option value="Batting">Batting</option>
                  <option value="Bowling">Bowling</option>
                  <option value="Fielding">Fielding</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="rating" className="block mb-2 font-medium">
                  Minimum Rating
                </label>
                <select
                  id="rating"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value={0}>All</option>
                  <option value={3}>3+ stars</option>
                  <option value={4}>4+ stars</option>
                  <option value={5}>5 stars</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white p-2 rounded hover:bg-blue-700 transition duration-300 flex items-center justify-center"
              >
                <Search size={20} className="mr-2" />
                Search
              </button>
            </form>
          </div>
        </div>
        <div className="w-full md:w-3/4">
          {filteredCoaches.length === 0 ? (
            <div className="text-center py-8">No coaches found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => (
                <div
                  key={coach._id}
                  className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition duration-300"
                >
                  <img
                    src={`/placeholder.svg?height=200&width=200`}
                    alt={coach.user.name}
                    className="w-full h-48 object-cover mb-4 rounded"
                  />
                  <h3 className="text-xl font-semibold mb-2">{coach.user.name}</h3>
                  <p className="text-gray-600 mb-2">{coach.specialization}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-yellow-500">
                      {"★".repeat(Math.floor(coach.averageRating))}
                      {"☆".repeat(5 - Math.floor(coach.averageRating))}
                    </span>
                    <span className="text-gray-600">${coach.hourlyRate}/hour</span>
                  </div>
                  <Link
                    to={`/coach/${coach._id}`}
                    className="block w-full bg-secondary text-white text-center px-4 py-2 rounded hover:bg-orange-600 transition duration-300"
                  >
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoachListingPage

