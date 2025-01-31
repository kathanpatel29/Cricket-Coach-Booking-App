import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import Header from "./components/Header"
import Footer from "./components/Footer"
import HomePage from "./pages/HomePage"
import CoachListingPage from "./pages/CoachListingPage"
import CoachProfilePage from "./pages/CoachProfilePage"
import BookingPage from "./pages/BookingPage"
import UserDashboard from "./pages/UserDashboard"
import CoachDashboard from "./pages/CoachDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import LoginRegisterPage from "./pages/LoginRegisterPage"
import PaymentPage from "./pages/PaymentPage"
import PrivateRoute from "./components/PrivateRoute"
import CoachOnboardingPage from "./features/coach/CoachOnboardingPage"
import "./index.css"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/coaches" element={<CoachListingPage />} />
              <Route path="/coach/:id" element={<CoachProfilePage />} />
              <Route
                path="/booking"
                element={
                  <PrivateRoute>
                    <BookingPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/user-dashboard"
                element={
                  <PrivateRoute>
                    <UserDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/coach-dashboard"
                element={
                  <PrivateRoute>
                    <CoachDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <PrivateRoute adminOnly={true}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="/login" element={<LoginRegisterPage />} />
              <Route
                path="/payment"
                element={
                  <PrivateRoute>
                    <PaymentPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/coach-onboarding"
                element={
                  <PrivateRoute>
                    <CoachOnboardingPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

