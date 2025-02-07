import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getUserBookings } from "../api/apiClient";

const UserDashboard = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    getUserBookings()
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <div className="max-w-3xl mx-auto mt-10 p-6 border rounded">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <p className="mt-2">Welcome, {user?.name}!</p>

        <h2 className="mt-6 text-xl font-bold">Your Bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-4">No bookings yet.</p>
        ) : (
          <ul className="mt-4">
            {bookings.map((booking) => (
              <li key={booking._id} className="p-3 border-b">
                <p><strong>Coach:</strong> {booking.coach.user.name}</p>
                <p><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {booking.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
