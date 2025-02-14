import { useState, useEffect } from "react";
import { bookingService } from "../../services/api";
import { formatDate } from "../../utils/helpers";
import Alert from "../../components/common/Alert";
import Loading from "../../components/common/Loading";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await bookingService.getUserBookings();
      if (response?.data?.data?.bookings) {
        setBookings(response.data.data.bookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError("");
      await bookingService.cancelBooking(bookingId);
      // Refresh bookings after cancellation
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {error && (
          <Alert 
            type="error" 
            message={error}
            onClose={() => setError("")}
            className="mb-4"
          />
        )}

        {bookings.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No bookings found.</p>
            <p className="text-sm text-gray-500 mt-2">Book a session with one of our coaches!</p>
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
                  Duration: {booking.duration} hour{booking.duration > 1 ? 's' : ''}
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
    </div>
  );
};

export default MyBookings; 