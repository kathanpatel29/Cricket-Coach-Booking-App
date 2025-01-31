import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import * as api from "../utils/api"

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [duration, setDuration] = useState(1)
  const [coach, setCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const coachId = searchParams.get("coachId")

  useEffect(() => {
    const fetchCoach = async () => {
      try {
        const response = await api.getCoachById(coachId)
        setCoach(response.data)
        setLoading(false)
      } catch (error) {
        setError("Failed to fetch coach details")
        setLoading(false)
      }
    }
    if (coachId) {
      fetchCoach()
    } else {
      setError("No coach selected")
      setLoading(false)
    }
  }, [coachId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const bookingData = {
        coachId,
        date: `${selectedDate}T${selectedTime}:00.000Z`,
        duration: Number.parseInt(duration),
      }
      const response = await api.createBooking(bookingData)
      navigate(`/payment?bookingId=${response.data._id}`)
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create booking")
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-poppins">Book a Coaching Session</h1>
      {coach && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Coach: {coach.user.name}</h2>
          <p>Specialization: {coach.specialization}</p>
          <p>Hourly Rate: ${coach.hourlyRate}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="time" className="block text-gray-700 text-sm font-bold mb-2">
            Time
          </label>
          <input
            type="time"
            id="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">
            Duration (hours)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="1"
            max="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Book Session
          </button>
        </div>
      </form>
    </div>
  )
}

export default BookingPage

