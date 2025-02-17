import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { publicRoutes, clientRoutes, coachRoutes, adminRoutes, defaultRoutes } from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}

            {/* Default Dashboard Route */}
            {defaultRoutes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}

            {/* Protected Routes */}
            {[...clientRoutes, ...coachRoutes, ...adminRoutes].map(({ path, element, roles }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute roles={roles}>
                    {element}
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;