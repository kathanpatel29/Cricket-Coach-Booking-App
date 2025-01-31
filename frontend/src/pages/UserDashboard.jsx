import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import * as api from "../utils/api"

const UserDashboard = () => {
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.getMe()
        setUser(userResponse.data)
        const bookingsResponse = await api.getClientBookings()
        setBookings(bookingsResponse.data)
        setLoading(false)
      } catch (error) {
        setError("Failed to fetch dashboard data")
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  const upcomingSessions = bookings.filter((booking) => new Date(booking.date) > new Date())
  const pastSessions = bookings.filter((booking) => new Date(booking.date) <= new Date())

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-poppins">My Dashboard</h1>
      {user && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}!</h2>
          <p className="text-gray-600">Email: {user.email}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
          {upcomingSessions.map((session) => (
            <div key={session._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
              <h3 className="font-semibold">{session.coach.user.name}</h3>
              <p>Date: {new Date(session.date).toLocaleDateString()}</p>
              <p>Time: {new Date(session.date).toLocaleTimeString()}</p>
              <p>Duration: {session.duration} hour(s)</p>
              <div className="mt-2">
                <button className="bg-primary text-white px-3 py-1 rounded mr-2 hover:bg-blue-700">Reschedule</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Cancel</button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          {pastSessions.map((session) => (
            <div key={session._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
              <h3 className="font-semibold">{session.coach.user.name}</h3>
              <p>Date: {new Date(session.date).toLocaleDateString()}</p>
              <p>Time: {new Date(session.date).toLocaleTimeString()}</p>
              <p>Duration: {session.duration} hour(s)</p>
              <button className="bg-secondary text-white px-3 py-1 rounded mt-2 hover:bg-orange-600">
                Leave Feedback
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <Link
          to="/coaches"
          className="bg-secondary text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-orange-600"
        >
          Book New Session
        </Link>
      </div>
    </div>
  )
}

export default UserDashboard

