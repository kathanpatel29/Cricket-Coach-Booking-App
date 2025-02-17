// Navigation links based on user role
export const getNavLinks = (role) => {
  // Public links available to all users
  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/coaches', label: 'Find Coaches' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
  ];

  // Role-specific links
  const roleBasedLinks = {
    client: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/bookings', label: 'My Bookings' },
      { to: '/payments', label: 'Payment History' }
    ],
    coach: [
      { to: '/coach/dashboard', label: 'Dashboard' },
      { to: '/coach/sessions', label: 'Sessions' },
      { to: '/coach/availability', label: 'Availability' },
      { to: '/coach/earnings', label: 'Earnings' }
    ],
    admin: [
      { to: '/admin-dashboard', label: 'Dashboard' },
    ]
  };

  // Return public links for guests, or public + role-specific links for logged-in users
  return role ? [...publicLinks, ...(roleBasedLinks[role] || [])] : publicLinks;
};

// Generate breadcrumbs based on current path
export const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];
  let currentPath = '';

  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    breadcrumbs.push({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
      path: currentPath,
      isLast: index === paths.length - 1
    });
  });

  return breadcrumbs;
}; 