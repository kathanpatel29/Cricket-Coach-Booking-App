import { useState, useEffect } from "react"
import * as api from "../utils/api"
import toast from "react-hot-toast"

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoaches: 0,
    totalBookings: 0,
    revenue: 0,
  })
  const [pendingCoaches, setPendingCoaches] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, pendingCoachesResponse, recentReviewsResponse] = await Promise.all([
          api.getAdminStats(),
          api.getPendingCoaches(),
          api.getRecentReviews(),
        ])
        setStats(statsResponse.data)
        setPendingCoaches(pendingCoachesResponse.data)
        setRecentReviews(recentReviewsResponse.data)
        setLoading(false)
      } catch (error) {
        setError("Failed to fetch admin dashboard data")
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApproveCoach = async (coachId) => {
    try {
      await api.approveCoach(coachId)
      setPendingCoaches(pendingCoaches.filter((coach) => coach._id !== coachId))
      toast.success("Coach approved successfully")
    } catch (error) {
      toast.error("Failed to approve coach")
    }
  }

  const handleRejectCoach = async (coachId) => {
    try {
      await api.rejectCoach(coachId)
      setPendingCoaches(pendingCoaches.filter((coach) => coach._id !== coachId))
      toast.success("Coach rejected successfully")
    } catch (error) {
      toast.error("Failed to reject coach")
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-poppins">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Coaches</h2>
          <p className="text-3xl font-bold text-primary">{stats.totalCoaches}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Bookings</h2>
          <p className="text-3xl font-bold text-primary">{stats.totalBookings}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Total Revenue</h2>
          <p className="text-3xl font-bold text-primary">${stats.revenue}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Pending Coach Approvals</h2>
          {pendingCoaches.length === 0 ? (
            <p>No pending coach approvals</p>
          ) : (
            pendingCoaches.map((coach) => (
              <div key={coach._id} className="mb-4 p-4 border rounded">
                <h3 className="font-semibold">{coach.name}</h3>
                <p className="text-gray-600">Email: {coach.email}</p>
                <div className="mt-2">
                  <button
                    onClick={() => handleApproveCoach(coach._id)}
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectCoach(coach._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Reviews</h2>
          {recentReviews.map((review) => (
            <div key={review._id} className="mb-4 p-4 border rounded">
              <h3 className="font-semibold">{review.coach.user.name}</h3>
              <p className="text-gray-600">Client: {review.client.name}</p>
              <p className="text-yellow-500">
                {"★".repeat(Math.floor(review.rating))}
                {"☆".repeat(5 - Math.floor(review.rating))}
              </p>
              <p className="mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

