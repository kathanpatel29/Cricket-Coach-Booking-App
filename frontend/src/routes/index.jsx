import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import { publicRoutes } from './publicRoutes.jsx';
import { userRoutes } from './userRoutes.jsx';
import { coachRoutes } from './coachRoutes.jsx';
import { adminRoutes } from './adminRoutes.jsx';
import NotFound from '../pages/error/404.jsx';

// Create and export the router as default
const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: publicRoutes
  },
  {
    path: '/admin',
    element: <DashboardLayout type="admin" />,
    children: adminRoutes
  },
  {
    path: '/coach',
    element: <DashboardLayout type="coach" />,
    children: coachRoutes
  },
  {
    path: '/user',
    element: <DashboardLayout type="user" />,
    children: userRoutes
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;
