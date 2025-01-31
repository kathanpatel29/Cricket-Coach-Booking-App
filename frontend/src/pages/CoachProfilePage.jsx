import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import * as api from "../utils/api"

const CoachProfilePage = () => {
  const { id } = useParams()
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCoach = async () => {
      try {
        const response = await api.getCoachById(id)
        setCoach(response.data)
        setLoading(false)
      } catch (error) {
        setError("Failed to fetch coach details")
        setLoading(false)
      }
    }
    fetchCoach()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>
  if (!coach) return <div>Coach not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-wrap -mx-4">
          <div className="w-full md:w-1/3 px-4 mb-4 md:mb-0">
            <img src={`/placeholder.svg?height=300&width=300`} alt={coach.user.name} className="w-full rounded-lg" />
          </div>
          <div className="w-full md:w-2/3 px-4">
            <h1 className="text-3xl font-bold mb-2 font-poppins">{coach.user.name}</h1>
            <p className="text-xl text-gray-600 mb-2">{coach.specialization}</p>
            <div className="flex items-center mb-4">
              <span className="text-yellow-500 text-xl mr-2">
                {"★".repeat(Math.floor(coach.averageRating))}
                {"☆".repeat(5 - Math.floor(coach.averageRating))}
              </span>
              <span className="text-gray-600">({coach.averageRating.toFixed(1)})</span>
            </div>
            <p className="mb-4">{coach.bio}</p>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Experience</h2>
              <p>{coach.experience} years</p>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Hourly Rate</h2>
              <p className="text-2xl font-bold text-primary">${coach.hourlyRate}/hour</p>
            </div>
            <Link
              to={`/booking?coachId=${coach._id}`}
              className="bg-secondary text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600"
            >
              Book a Session
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoachProfilePage

