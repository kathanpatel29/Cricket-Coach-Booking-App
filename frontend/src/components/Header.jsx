import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import { Menu, X, User, LogOut } from "lucide-react"

const Header = () => {
  const { user, logout } = useContext(AuthContext)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold font-poppins">
            CricCoach
          </Link>
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="hover:text-secondary transition duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/coaches" className="hover:text-secondary transition duration-300">
                  Find Coaches
                </Link>
              </li>
              {user ? (
                <>
                  {user.role === "client" && (
                    <li>
                      <Link to="/user-dashboard" className="hover:text-secondary transition duration-300">
                        My Bookings
                      </Link>
                    </li>
                  )}
                  {user.role === "coach" && (
                    <li>
                      <Link to="/coach-dashboard" className="hover:text-secondary transition duration-300">
                        Coach Dashboard
                      </Link>
                    </li>
                  )}
                  {user.role === "admin" && (
                    <li>
                      <Link to="/admin-dashboard" className="hover:text-secondary transition duration-300">
                        Admin Dashboard
                      </Link>
                    </li>
                  )}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center hover:text-secondary transition duration-300"
                    >
                      <LogOut size={18} className="mr-1" />
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login" className="flex items-center hover:text-secondary transition duration-300">
                    <User size={18} className="mr-1" />
                    Login/Register
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="px-4 pt-2 pb-4 bg-primary">
            <ul className="space-y-2">
              <li>
                <Link to="/" className="block py-2 hover:text-secondary transition duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/coaches" className="block py-2 hover:text-secondary transition duration-300">
                  Find Coaches
                </Link>
              </li>
              {user ? (
                <>
                  {user.role === "client" && (
                    <li>
                      <Link to="/user-dashboard" className="block py-2 hover:text-secondary transition duration-300">
                        My Bookings
                      </Link>
                    </li>
                  )}
                  {user.role === "coach" && (
                    <li>
                      <Link to="/coach-dashboard" className="block py-2 hover:text-secondary transition duration-300">
                        Coach Dashboard
                      </Link>
                    </li>
                  )}
                  {user.role === "admin" && (
                    <li>
                      <Link to="/admin-dashboard" className="block py-2 hover:text-secondary transition duration-300">
                        Admin Dashboard
                      </Link>
                    </li>
                  )}
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center py-2 hover:text-secondary transition duration-300"
                    >
                      <LogOut size={18} className="mr-1" />
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login" className="flex items-center py-2 hover:text-secondary transition duration-300">
                    <User size={18} className="mr-1" />
                    Login/Register
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header

