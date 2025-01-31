import { useState, useEffect } from "react"
import * as api from "../utils/api"

const CoachDashboard = () => {
  const [coach, setCoach] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await api.getMe()
        setCoach(userResponse.data)
        const bookingsResponse = await api.getCoachBookings()
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
      <h1 className="text-3xl font-bold mb-6 font-poppins">Coach Dashboard</h1>
      {coach && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {coach.name}!</h2>
          <p className="text-gray-600">Email: {coach.email}</p>
          <p className="text-gray-600">Specialization: {coach.specialization}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Sessions</h2>
          {upcomingSessions.map((session) => (
            <div key={session._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
              <h3 className="font-semibold">{session.client.name}</h3>
              <p>Date: {new Date(session.date).toLocaleDateString()}</p>
              <p>Time: {new Date(session.date).toLocaleTimeString()}</p>
              <p>Duration: {session.duration} hour(s)</p>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Sessions</h2>
          {pastSessions.map((session) => (
            <div key={session._id} className="bg-white shadow-md rounded-lg p-4 mb-4">
              <h3 className="font-semibold">{session.client.name}</h3>
              <p>Date: {new Date(session.date).toLocaleDateString()}</p>
              <p>Time: {new Date(session.date).toLocaleTimeString()}</p>
              <p>Duration: {session.duration} hour(s)</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Manage Availability</h2>
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Add a calendar component here for managing availability */}
          <p className="text-gray-600">Calendar component for managing availability will be implemented here.</p>
        </div>
      </div>
    </div>
  )
}

export default CoachDashboard

