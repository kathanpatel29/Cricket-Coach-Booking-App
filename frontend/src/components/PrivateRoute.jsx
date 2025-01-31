import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" />
  }

  if (user.role === "coach" && !user.isApproved) {
    return <div>Your account is pending approval. Please wait for an admin to approve your account.</div>
  }

  return children
}

export default PrivateRoute

