import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingService, coachService } from "../../services/api";
import { formatDate, getTimeSlots } from "../../utils/helpers";
import Alert from "../../components/common/Alert";
import Loading from "../../components/common/Loading";
import PaymentForm from "../../components/features/payments/PaymentForm";

const Bookings = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [coach, setCoach] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();
  const { coachId } = useParams();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchCoachDetails();
  }, [coachId]);

  useEffect(() => {
    if (date) {
      fetchAvailableSlots();
    }
  }, [date, coachId]);

  const fetchCoachDetails = async () => {
    try {
      const response = await coachService.getById(coachId);
      setCoach(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Error fetching coach details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await bookingService.getAvailableSlots(coachId, date);
      setAvailableSlots(response.data);
    } catch (error) {
      setError(error.response?.data?.message || "Error fetching available slots");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const bookingData = {
        coachId,
        date: `${date}T${time}`,
        duration: parseInt(duration)
      };

      const response = await bookingService.create(bookingData);
      setBookingId(response.data.bookingId);
      setShowPayment(true);
    } catch (error) {
      setError(error.response?.data?.message || "Error creating booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate("/dashboard", { 
      state: { message: "Booking confirmed and payment processed successfully!" }
    });
  };

  const handlePaymentError = () => {
    setError("Payment failed. Please try again.");
    setShowPayment(false);
  };

  if (loading) return <Loading />;
  if (!coach) return <Alert type="error" message="Coach not found" />;

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Complete Payment</h1>
            <PaymentForm
              bookingId={bookingId}
              amount={coach.hourlyRate * duration}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Book a Session</h1>

          {error && <Alert type="error" message={error} />}

          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-2">Coach Details</h2>
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center space-x-4">
                {coach.profileImage && (
                  <img 
                    src={coach.profileImage} 
                    alt={coach.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{coach.name}</h3>
                  <p className="text-gray-600">{coach.specialization}</p>
                  <p className="text-sm text-gray-500">Experience: {coach.experience} years</p>
                  <p className="text-sm text-gray-500">Rate: ${coach.hourlyRate}/hour</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              />
            </div>

            {date && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select a time slot</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration (hours)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
              >
                {[1, 2, 3].map(value => (
                  <option key={value} value={value}>
                    {value} hour{value > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {time && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Date: {formatDate(`${date}T${time}`)}</p>
                  <p>Duration: {duration} hour{duration > 1 ? 's' : ''}</p>
                  <p>Rate: ${coach.hourlyRate} per hour</p>
                  <p className="font-medium text-gray-900">
                    Total Amount: ${coach.hourlyRate * duration}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !time}
              className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Bookings;