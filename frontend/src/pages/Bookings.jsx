import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const Bookings = () => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(1);
  const [coach, setCoach] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const navigate = useNavigate();
  const { coachId } = useParams();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Fetch coach details and availability
    const fetchCoachDetails = async () => {
      try {
        const response = await axios.get(`/api/coaches/${coachId}`);
        setCoach(response.data);
      } catch (error) {
        console.error("Error fetching coach details:", error);
        alert("Error loading coach details");
      }
    };

    fetchCoachDetails();
  }, [coachId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!date || !time) {
      alert("Please select both date and time");
      return;
    }

    // Combine date and time
    const dateTime = new Date(`${date}T${time}`);
    
    try {
      await axios.post("/api/bookings", {
        coachId,
        date: dateTime,
        duration
      });
      alert("Booking created successfully!");
      navigate("/client/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Error creating booking");
    }
  };

  if (!coach) return <div className="text-center mt-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book a Session</h1>
        <p className="mt-2 text-gray-600">with {coach.user?.name}</p>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 rounded p-4">
          <p className="text-sm text-gray-600">Rate: ${coach.hourlyRate}/hour</p>
          <p className="text-sm text-gray-600">Specialization: {coach.specialization}</p>
        </div>
      </div>

      <form onSubmit={handleBooking} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Time
          </label>
          <input 
            type="time" 
            value={time} 
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (hours)
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            required
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={3}>3 hours</option>
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900">Booking Summary</h3>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">Duration: {duration} hour(s)</p>
            <p className="text-sm text-gray-600">
              Total Amount: ${coach.hourlyRate * duration}
            </p>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          Confirm Booking
        </button>
      </form>
    </div>
  );
};

export default Bookings;