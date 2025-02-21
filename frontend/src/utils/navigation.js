// Navigation links based on user role
export const getNavLinks = (type) => {
  switch (type) {
    case 'admin':
      return [
        { path: '/admin', label: 'Dashboard' },
        { path: '/admin/users', label: 'Users' },
        { path: '/admin/coaches', label: 'Coach Approvals' },
        { path: '/admin/bookings', label: 'Bookings' },
        { path: '/admin/payments', label: 'Payments' },
        { path: '/admin/profile', label: 'Profile' }
      ];
    case 'coach':
      return [
        { path: '/coach', label: 'Dashboard' },
        { path: '/coach/sessions', label: 'Sessions' },
        { path: '/coach/availability', label: 'Availability' },
        { path: '/coach/reviews', label: 'Reviews' },
        { path: '/coach/earnings', label: 'Earnings' },
        { path: '/coach/profile', label: 'Profile' }
      ];
    case 'user':
    default:
      return [
        { path: '/user', label: 'Dashboard' },
        { path: '/user/book', label: 'Book Session' },
        { path: '/user/bookings', label: 'My Bookings' },
        { path: '/user/profile', label: 'Profile' }
      ];
  }
};

// Generate breadcrumbs based on current path
export const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  return paths.map((path, index) => ({
    label: path.charAt(0).toUpperCase() + path.slice(1),
    path: '/' + paths.slice(0, index + 1).join('/')
  }));
}; 