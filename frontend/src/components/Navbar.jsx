import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-primary p-4 flex justify-between items-center text-white">
      <Link to="/" className="text-lg font-bold">CricCoach</Link>
      <div>
        {user ? (
          <>
            <Link to="/dashboard" className="mr-4">Dashboard</Link>
            {user.role === "client" && (
              <Link to="/bookings" className="mr-4">Bookings</Link>
            )}
            {user.role === "coach" && (
              <Link to="/availability" className="mr-4">Availability</Link>
            )}
            <button onClick={logout} className="bg-secondary px-4 py-2 rounded">Logout</button>
          </>

        ) : (
          <Link to="/login" className="bg-secondary px-4 py-2 rounded">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
