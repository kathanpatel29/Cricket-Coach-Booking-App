import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bookingService, coachService } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import Alert from "../../components/common/Alert";
import Loading from "../../components/common/Loading";

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Sequential fetching to handle errors better
      const bookingsRes = await bookingService.getUserBookings();
      if (bookingsRes?.data?.data?.bookings) {
        setBookings(bookingsRes.data.data.bookings);
      }

      const coachesRes = await coachService.getAll();
      if (coachesRes?.data?.data?.coaches) {
        setCoaches(coachesRes.data.data.coaches);
      }

    } catch (err) {
      console.error('Dashboard Error:', err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      // Keep existing data if available
      if (!bookings.length) setBookings([]);
      if (!coaches.length) setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError("");
      await bookingService.cancelBooking(bookingId);
      // Refresh only bookings after cancellation
      const response = await bookingService.getUserBookings();
      if (response?.data?.data?.bookings) {
        setBookings(response.data.data.bookings);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {error && (
        <Alert 
          type="error" 
          message={error}
          onClose={() => setError("")}
          className="mb-4"
        />
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bookings</h2>
        {bookings.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No bookings found.</p>
            <p className="text-sm text-gray-500 mt-2">Book a session with one of our coaches below!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {booking.coach?.name || 'Coach Name Unavailable'}
                    </h3>
                    <p className="text-gray-600">{formatDate(booking.date)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Time: {booking.timeSlot || 'Time not specified'}
                </p>
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Coaches</h2>
        {coaches.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No coaches available at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">Please check back later!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {coaches.map((coach) => (
              <div key={coach._id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-2">{coach.name}</h3>
                <p className="text-gray-600 mb-1">{coach.specialization}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Experience: {coach.experience} years
                </p>
                <Link
                  to={`/book/${coach._id}`}
                  className="block text-center bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
                >
                  Book Session
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;