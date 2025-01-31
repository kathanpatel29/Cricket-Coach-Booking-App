import { createContext, useState, useEffect } from "react"
import api from "../utils/api"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/me")
      setUser(response.data)
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, admin_secret_key = null) => {
    try {
      const response = await api.post("/auth/login", { email, password, admin_secret_key })
      localStorage.setItem("token", response.data.token)
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      throw error.response.data
    }
  }

  const register = async (name, email, password, role, admin_secret_key = null) => {
    try {
      const response = await api.post("/auth/register", { name, email, password, role, admin_secret_key })
      localStorage.setItem("token", response.data.token)
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      throw error.response.data
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

