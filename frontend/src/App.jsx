import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { publicRoutes, clientRoutes, coachRoutes, adminRoutes, sharedProtectedRoutes } from './routes';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map(route => (
              <Route 
                key={route.path} 
                path={route.path} 
                element={route.element} 
              />
            ))}

            {/* Protected Client Routes */}
            {clientRoutes.map(route => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute roles={route.roles}>
                    {route.element}
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
                    {route.element}
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
                    {route.element}
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
                    {route.element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;