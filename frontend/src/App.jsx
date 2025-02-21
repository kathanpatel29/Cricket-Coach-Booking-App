  import React from 'react';
  import { RouterProvider } from 'react-router-dom';
  import { Toaster } from 'react-hot-toast';
  import router from './routes';
  import AuthProvider from './contexts/AuthContext';
  import ErrorBoundary from './components/common/ErrorBoundary';

  function App() {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  export default App;
