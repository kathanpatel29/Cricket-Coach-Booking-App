import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

const CoachDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState(1);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?.isApproved) {
      axios.get("/api/bookings/coach").then((res) => setBookings(res.data));
      axios.get("/api/coaches/me").then((res) => setAvailability(res.data.availability));
    }
  }, [user]);

  const updateAvailability = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/coaches/availability", { date, capacity });
      setAvailability([...availability, { date, capacity }]);
      setDate("");
      setCapacity(1);
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  if (!user?.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-8 rounded-xl shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-yellow-800">Pending Approval</h3>
                <div className="mt-3 text-yellow-700">
                  <p className="text-base">Your coach account is currently pending admin approval. Once approved, you'll have access to:</p>
                  <ul className="list-disc list-inside mt-4 space-y-2">
                    <li>Managing your availability</li>
                    <li>Viewing and managing bookings</li>
                    <li>Setting up appointments</li>
                    <li>Accessing client information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your availability and view upcoming bookings</p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Manage Availability
              </h2>
              <form onSubmit={updateAvailability} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Select Date
                  </label>
                  <input 
                    id="date"
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                  />
                </div>
                
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Available Slots
                  </label>
                  <input 
                    id="capacity"
                    type="number" 
                    value={capacity} 
                    onChange={(e) => setCapacity(e.target.value)} 
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 font-medium"
                >
                  Add Availability
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Upcoming Bookings
              </h2>
              {bookings.length === 0 ? (
                <div className="mt-6 text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-4 text-gray-600">No upcoming bookings</p>
                </div>
              ) : (
                <ul className="mt-6 divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <li key={booking._id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{booking.client.name}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(booking.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CoachDashboard;