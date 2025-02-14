import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import { publicRoutes, clientRoutes, coachRoutes, adminRoutes, sharedProtectedRoutes } from './routes';

// Lazy load components
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const About = React.lazy(() => import('./pages/static/About'));
const Contact = React.lazy(() => import('./pages/static/Contact'));
const FAQ = React.lazy(() => import('./pages/static/FAQ'));
const Terms = React.lazy(() => import('./pages/static/Terms'));
const Privacy = React.lazy(() => import('./pages/static/Privacy'));
const Profile = React.lazy(() => import('./pages/profile/Profile'));
const Availability = React.lazy(() => import('./pages/bookings/Availability'));
const UserDashboard = React.lazy(() => import('./pages/dashboard/UserDashboard'));
const CoachDashboard = React.lazy(() => import('./pages/dashboard/CoachDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard'));
const Bookings = React.lazy(() => import('./pages/bookings/Bookings'));

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              {publicRoutes.map(route => (
                <Route 
                  key={route.path} 
                  path={route.path} 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      {route.element}
                    </Suspense>
                  } 
                />
              ))}

              {/* Protected Client Routes */}
              {clientRoutes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <ProtectedRoute roles={route.roles}>
                      <Suspense fallback={<LoadingSpinner />}>
                        {route.element}
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              ))}

              {/* Protected Coach Routes */}
              {coachRoutes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <ProtectedRoute roles={route.roles}>
                      <Suspense fallback={<LoadingSpinner />}>
                        {route.element}
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              ))}

              {/* Protected Admin Routes */}
              {adminRoutes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <ProtectedRoute roles={route.roles}>
                      <Suspense fallback={<LoadingSpinner />}>
                        {route.element}
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              ))}

              {/* Shared Protected Routes */}
              {sharedProtectedRoutes.map(route => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <ProtectedRoute roles={route.roles}>
                      <Suspense fallback={<LoadingSpinner />}>
                        {route.element}
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              ))}
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
