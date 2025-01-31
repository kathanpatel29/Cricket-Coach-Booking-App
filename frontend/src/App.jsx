import React from "react"
import { Routes, Route } from "react-router-dom"
import { motion } from "framer-motion"
import Layout from "./components/Layout/Layout"
import Home from "./pages/Home"
import Coaches from "./pages/Coaches"
import Booking from "./pages/Booking"
import Dashboard from "./pages/Dashboard"
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import AdminDashboard from "./pages/AdminDashboard"
import CoachProfile from "./pages/CoachProfile"

function App() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/coaches/:id" element={<CoachProfile />} />
          <Route path="/booking/:coachId" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </motion.div>
  )
}

export default App

